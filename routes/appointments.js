const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/appointments
// @desc    Get all appointments
// @access  Private (Admin, Doctor, Patient)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date, doctorId, patientId, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Filter by doctor
    if (doctorId) {
      query.doctorId = doctorId;
    }

    // Filter by patient
    if (patientId) {
      query.patientId = patientId;
    }

    // Role-based filtering
    if (req.user.role === 'doctor') {
      // Doctor can only see their own appointments
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (doctor) {
        query.doctorId = doctor._id;
      }
    } else if (req.user.role === 'patient') {
      // Patient can only see their own appointments
      const patient = await Patient.findOne({ patientId: req.user.userId });
      if (patient) {
        query.patientId = patient._id;
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private (Admin, Doctor, Patient - own appointment)
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name patientId age gender contact')
      .populate('doctorId', 'name specialization contact');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check permissions
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ patientId: req.user.userId });
      if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!doctor || appointment.doctorId._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (Admin, Doctor)
router.post('/', auth, authorize('admin', 'doctor'), [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('fee').isFloat({ min: 0 }).withMessage('Valid fee is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, doctorId, date, time, reason, fee, duration = 30, type = 'consultation' } = req.body;

    // Find patient and doctor
    const patient = await Patient.findOne({ patientId });
    const doctor = await Doctor.findOne({ doctorId });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check for appointment conflicts
    const hasConflict = await Appointment.checkConflict(
      doctor._id,
      new Date(date),
      time,
      duration
    );

    if (hasConflict) {
      return res.status(400).json({ error: 'Appointment time conflicts with existing appointment' });
    }

    // Check if doctor is available
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    if (!doctor.isAvailable(dayOfWeek, time)) {
      return res.status(400).json({ error: 'Doctor is not available at this time' });
    }

    const appointmentData = {
      appointmentId: await Appointment.generateAppointmentId(),
      patientId: patient._id,
      doctorId: doctor._id,
      date: appointmentDate,
      time,
      reason,
      fee,
      duration,
      type
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (Admin, Doctor)
router.put('/:id', auth, authorize('admin', 'doctor'), [
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('reason').optional().notEmpty().withMessage('Reason cannot be empty'),
  body('fee').optional().isFloat({ min: 0 }).withMessage('Valid fee is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if doctor can modify this appointment
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check for conflicts if date/time is being changed
    if (req.body.date || req.body.time) {
      const newDate = req.body.date ? new Date(req.body.date) : appointment.date;
      const newTime = req.body.time || appointment.time;
      const newDuration = req.body.duration || appointment.duration;

      const hasConflict = await Appointment.checkConflict(
        appointment.doctorId,
        newDate,
        newTime,
        newDuration,
        appointment._id
      );

      if (hasConflict) {
        return res.status(400).json({ error: 'Appointment time conflicts with existing appointment' });
      }
    }

    Object.keys(req.body).forEach(key => {
      if (key === 'date') {
        appointment[key] = new Date(req.body[key]);
      } else {
        appointment[key] = req.body[key];
      }
    });

    await appointment.save();

    res.json({
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Admin, Doctor)
router.put('/:id/status', auth, authorize('admin', 'doctor'), [
  body('status').isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Valid status is required'),
  body('cancellationReason').optional().notEmpty().withMessage('Cancellation reason cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if doctor can modify this appointment
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    appointment.status = req.body.status;
    
    if (req.body.status === 'cancelled') {
      appointment.cancellationReason = req.body.cancellationReason;
      appointment.cancelledBy = req.user.role;
      appointment.cancelledAt = new Date();
    }

    await appointment.save();

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/appointments/patient/:patientId
// @desc    Get appointments by patient ID
// @access  Private (Admin, Doctor, Patient - own appointments)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status, date, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check permissions
    if (req.user.role === 'patient') {
      const currentPatient = await Patient.findOne({ patientId: req.user.userId });
      if (!currentPatient || patient._id.toString() !== currentPatient._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!doctor) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = { patientId: patient._id };
    
    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Additional filtering for doctors
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (doctor) {
        query.doctorId = doctor._id;
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/appointments/doctor/:doctorId
// @desc    Get appointments by doctor ID
// @access  Private (Admin, Doctor - own appointments)
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status, date, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    // Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check permissions
    if (req.user.role === 'doctor') {
      const currentDoctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!currentDoctor || doctor._id.toString() !== currentDoctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = { doctorId: doctor._id };
    
    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await appointment.remove();

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
const express = require('express');
const { body, validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/medical-records
// @desc    Get all medical records
// @access  Private (Admin, Doctor, Patient)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, doctorId, date, status, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    let query = {};
    
    // Filter by patient
    if (patientId) {
      const patient = await Patient.findOne({ patientId });
      if (patient) {
        query.patientId = patient._id;
      }
    }

    // Filter by doctor
    if (doctorId) {
      const doctor = await Doctor.findOne({ doctorId });
      if (doctor) {
        query.doctorId = doctor._id;
      }
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Role-based filtering
    if (req.user.role === 'patient') {
      // Patient can only see their own records
      const patient = await Patient.findOne({ patientId: req.user.userId });
      if (patient) {
        query.patientId = patient._id;
      }
    } else if (req.user.role === 'doctor') {
      // Doctor can only see records they created
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (doctor) {
        query.doctorId = doctor._id;
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'date time reason')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicalRecord.countDocuments(query);

    res.json({
      records,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/medical-records/:id
// @desc    Get medical record by ID
// @access  Private (Admin, Doctor, Patient - own records)
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'name patientId age gender contact')
      .populate('doctorId', 'name specialization contact')
      .populate('appointmentId', 'date time reason');

    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Check permissions
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ patientId: req.user.userId });
      if (!patient || record.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!doctor || record.doctorId._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ record });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/medical-records
// @desc    Create new medical record
// @access  Private (Admin, Doctor)
router.post('/', auth, authorize('admin', 'doctor'), [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('diagnosis.primary').notEmpty().withMessage('Primary diagnosis is required'),
  body('notes.assessment').notEmpty().withMessage('Assessment is required'),
  body('notes.plan').notEmpty().withMessage('Treatment plan is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, appointmentId, diagnosis, symptoms, vitalSigns, examination, treatment, labResults, imaging, notes, followUp, status = 'active' } = req.body;

    // Find patient and doctor
    const patient = await Patient.findOne({ patientId });
    const doctor = await Doctor.findOne({ doctorId: req.user.userId });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if appointment exists if provided
    let appointment = null;
    if (appointmentId) {
      const Appointment = require('../models/Appointment');
      appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
    }

    const recordData = {
      recordId: await MedicalRecord.generateRecordId(),
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentId: appointment?._id,
      date: new Date(),
      diagnosis,
      symptoms,
      vitalSigns,
      examination,
      treatment,
      labResults,
      imaging,
      notes,
      followUp,
      status
    };

    const record = new MedicalRecord(recordData);
    await record.save();

    res.status(201).json({
      message: 'Medical record created successfully',
      record
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/medical-records/:id
// @desc    Update medical record
// @access  Private (Admin, Doctor - own records)
router.put('/:id', auth, authorize('admin', 'doctor'), [
  body('diagnosis.primary').optional().notEmpty().withMessage('Primary diagnosis cannot be empty'),
  body('notes.assessment').optional().notEmpty().withMessage('Assessment cannot be empty'),
  body('notes.plan').optional().notEmpty().withMessage('Treatment plan cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Check if doctor can modify this record
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!doctor || record.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    Object.keys(req.body).forEach(key => {
      record[key] = req.body[key];
    });

    await record.save();

    res.json({
      message: 'Medical record updated successfully',
      record
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/medical-records/:id
// @desc    Delete medical record
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    await record.remove();

    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get patient's medical history
// @access  Private (Admin, Doctor, Patient - own history)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && req.params.patientId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!doctor || patient.assignedDoctor?.toString() !== doctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const records = await MedicalRecord.getPatientHistory(patient._id, 20);

    res.json({
      patient: {
        name: patient.name,
        patientId: patient.patientId,
        age: patient.age,
        gender: patient.gender
      },
      records
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/medical-records/doctor/:doctorId
// @desc    Get doctor's medical records
// @access  Private (Admin, Doctor - own records)
router.get('/doctor/:doctorId', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.params.doctorId });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if doctor can access these records
    if (req.user.role === 'doctor' && req.params.doctorId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const records = await MedicalRecord.getDoctorRecords(doctor._id, 20);

    res.json({
      doctor: {
        name: doctor.name,
        doctorId: doctor.doctorId,
        specialization: doctor.specialization
      },
      records
    });
  } catch (error) {
    console.error('Get doctor records error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
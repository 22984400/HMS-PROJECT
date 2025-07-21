const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Private (Admin, Doctor)
router.get('/', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, specialization, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { doctorId: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const doctors = await Doctor.find(query)
      .populate('assignedPatients', 'name patientId')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Private (Admin, Doctor)
router.get('/:id', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('assignedPatients', 'name patientId age gender');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/doctors
// @desc    Create new doctor
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('contact.phone').notEmpty().withMessage('Phone number is required'),
  body('contact.email').isEmail().withMessage('Valid email is required'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Valid consultation fee is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctorData = req.body;
    doctorData.doctorId = await Doctor.generateDoctorId();

    const doctor = new Doctor(doctorData);
    await doctor.save();

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/doctors/:id
// @desc    Update doctor
// @access  Private (Admin, Doctor - own profile)
router.put('/:id', auth, authorize('admin', 'doctor'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('specialization').optional().notEmpty().withMessage('Specialization cannot be empty'),
  body('contact.phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('contact.email').optional().isEmail().withMessage('Valid email is required'),
  body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Valid consultation fee is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Doctor can only update their own profile
    if (req.user.role === 'doctor' && doctor.doctorId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.keys(req.body).forEach(key => {
      doctor[key] = req.body[key];
    });

    await doctor.save();

    res.json({
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/doctors/:id
// @desc    Delete doctor (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    doctor.isActive = false;
    await doctor.save();

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/doctors/:id/schedule
// @desc    Get doctor's schedule
// @access  Private (Admin, Doctor)
router.get('/:id/schedule', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      schedule: doctor.availability.schedule,
      isOnLeave: doctor.availability.isOnLeave,
      leaveDates: doctor.availability.leaveDates
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/doctors/:id/schedule
// @desc    Update doctor's schedule
// @access  Private (Admin, Doctor - own schedule)
router.put('/:id/schedule', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Doctor can only update their own schedule
    if (req.user.role === 'doctor' && doctor.doctorId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    doctor.availability = req.body.availability;
    await doctor.save();

    res.json({
      message: 'Schedule updated successfully',
      availability: doctor.availability
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
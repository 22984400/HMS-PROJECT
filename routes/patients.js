const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (Admin, Doctor)
router.get('/', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    let query = { isActive: true };
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Doctor can only see their assigned patients
    if (req.user.role === 'doctor') {
      query.assignedDoctor = req.user._id;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'name specialization')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private (Admin, Doctor, Patient - own records)
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name specialization');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if user has permission to view this patient
    if (req.user.role === 'patient' && patient.patientId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'doctor' && patient.assignedDoctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (Admin, Doctor)
router.post('/', auth, authorize('admin', 'doctor'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('contact.phone').notEmpty().withMessage('Phone number is required'),
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientData = req.body;
    
    // Generate unique patient ID
    patientData.patientId = await Patient.generatePatientId();

    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({
      message: 'Patient created successfully',
      patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (Admin, Doctor)
router.put('/:id', auth, authorize('admin', 'doctor'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('contact.phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Doctor can only update their assigned patients
    if (req.user.role === 'doctor' && patient.assignedDoctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.keys(req.body).forEach(key => {
      patient[key] = req.body[key];
    });

    await patient.save();

    res.json({
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patient.isActive = false;
    await patient.save();

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/patients/:id/medical-history
// @desc    Get patient medical history
// @access  Private (Admin, Doctor, Patient - own history)
router.get('/:id/medical-history', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && patient.patientId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'doctor' && patient.assignedDoctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      medications: patient.medications
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/patients/doctor/:doctorId
// @desc    Get patients by doctor ID
// @access  Private (Admin, Doctor - own patients)
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Check permissions
    if (req.user.role === 'doctor') {
      const currentDoctor = await Doctor.findOne({ doctorId: req.user.userId });
      if (!currentDoctor || doctorId !== currentDoctor._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = { 
      isActive: true,
      assignedDoctor: doctorId
    };
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'name specialization')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patients by doctor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/patients/:id/assign-doctor
// @desc    Assign doctor to patient
// @access  Private (Admin only)
router.post('/:id/assign-doctor', auth, authorize('admin'), [
  body('doctorId').notEmpty().withMessage('Doctor ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patient.assignedDoctor = req.body.doctorId;
    await patient.save();

    res.json({
      message: 'Doctor assigned successfully',
      patient
    });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
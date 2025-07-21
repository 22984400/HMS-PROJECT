const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  diagnosis: {
    primary: {
      type: String,
      required: true,
      trim: true
    },
    secondary: [String],
    icd10Code: String
  },
  symptoms: [{
    symptom: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String
  }],
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number
  },
  examination: {
    general: String,
    cardiovascular: String,
    respiratory: String,
    gastrointestinal: String,
    neurological: String,
    musculoskeletal: String,
    skin: String
  },
  treatment: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    procedures: [{
      name: String,
      date: Date,
      notes: String
    }],
    recommendations: [String]
  },
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    date: Date,
    lab: String
  }],
  imaging: [{
    type: String,
    date: Date,
    findings: String,
    radiologist: String
  }],
  notes: {
    subjective: String, // Patient's description
    objective: String,  // Doctor's observations
    assessment: String, // Doctor's assessment
    plan: String       // Treatment plan
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    reason: String
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'chronic', 'follow-up'],
    default: 'active'
  },
  isConfidential: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique medical record ID
medicalRecordSchema.statics.generateRecordId = async function() {
  const count = await this.countDocuments();
  return `MR${String(count + 1).padStart(5, '0')}`;
};

// Method to get patient's medical history
medicalRecordSchema.statics.getPatientHistory = async function(patientId, limit = 10) {
  return this.find({ patientId })
    .populate('doctorId', 'name specialization')
    .populate('appointmentId', 'date time reason')
    .sort({ date: -1 })
    .limit(limit);
};

// Method to get records by doctor
medicalRecordSchema.statics.getDoctorRecords = async function(doctorId, limit = 10) {
  return this.find({ doctorId })
    .populate('patientId', 'name patientId age gender')
    .populate('appointmentId', 'date time')
    .sort({ date: -1 })
    .limit(limit);
};

// Index for better query performance
medicalRecordSchema.index({ recordId: 1 });
medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ doctorId: 1 });
medicalRecordSchema.index({ date: 1 });
medicalRecordSchema.index({ 'diagnosis.primary': 1 });
medicalRecordSchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema); 
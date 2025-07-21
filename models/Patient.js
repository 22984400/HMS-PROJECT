const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  contact: {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalHistory: [{
    condition: String,
    diagnosis: String,
    treatment: String,
    date: {
      type: Date,
      default: Date.now
    },
    doctorId: String
  }],
  allergies: [{
    allergen: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    notes: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: String
  }],
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }
}, {
  timestamps: true
});

// Generate unique patient ID
patientSchema.statics.generatePatientId = async function() {
  const count = await this.countDocuments();
  return `P${String(count + 1).padStart(5, '0')}`;
};

// Index for better query performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ name: 1 });
patientSchema.index({ assignedDoctor: 1 });

module.exports = mongoose.model('Patient', patientSchema); 
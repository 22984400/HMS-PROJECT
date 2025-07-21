const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: {
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
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  contact: {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
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
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String,
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    isOnLeave: {
      type: Boolean,
      default: false
    },
    leaveDates: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }]
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  experience: {
    years: {
      type: Number,
      min: 0
    },
    description: String
  },
  languages: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  consultationHistory: [{
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    date: {
      type: Date,
      default: Date.now
    },
    diagnosis: String,
    treatment: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Generate unique doctor ID
doctorSchema.statics.generateDoctorId = async function() {
  const count = await this.countDocuments();
  return `D${String(count + 1).padStart(5, '0')}`;
};

// Method to check if doctor is available on a specific date and time
doctorSchema.methods.isAvailable = function(date, time) {
  const dayOfWeek = date.toLowerCase();
  const schedule = this.availability.schedule.find(s => s.day === dayOfWeek);
  
  if (!schedule || !schedule.isAvailable) return false;
  
  // Check if doctor is on leave
  const isOnLeave = this.availability.leaveDates.some(leave => 
    date >= leave.startDate && date <= leave.endDate
  );
  
  if (isOnLeave) return false;
  
  // Check time availability
  return time >= schedule.startTime && time <= schedule.endTime;
};

// Index for better query performance
doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ name: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Doctor', doctorSchema); 
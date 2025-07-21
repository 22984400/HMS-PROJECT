const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
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
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 120
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine', 'specialist'],
    default: 'consultation'
  },
  notes: {
    type: String,
    trim: true
  },
  symptoms: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'waived'],
    default: 'pending'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'admin']
  },
  cancelledAt: Date
}, {
  timestamps: true
});

// Generate unique appointment ID
appointmentSchema.statics.generateAppointmentId = async function() {
  const count = await this.countDocuments();
  return `A${String(count + 1).padStart(5, '0')}`;
};

// Method to check if appointment time conflicts with existing appointments
appointmentSchema.statics.checkConflict = async function(doctorId, date, time, duration, excludeId = null) {
  const startTime = new Date(date);
  const [hours, minutes] = time.split(':');
  startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + duration);
  
  const query = {
    doctorId,
    date: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    },
    status: { $nin: ['cancelled', 'no-show'] }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const conflictingAppointments = await this.find(query);
  
  return conflictingAppointments.some(appointment => {
    const appointmentStart = new Date(appointment.date);
    const [appHours, appMinutes] = appointment.time.split(':');
    appointmentStart.setHours(parseInt(appHours), parseInt(appMinutes), 0, 0);
    
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.duration);
    
    return (startTime < appointmentEnd && endTime > appointmentStart);
  });
};

// Index for better query performance
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema); 
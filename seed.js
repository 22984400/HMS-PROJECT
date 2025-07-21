const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hms_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample data
const sampleUsers = [
  {
    userId: 'admin123',
    role: 'admin',
    password: '000000',
    name: 'System Administrator',
    email: 'admin@gmail.com',
    phone: '+1234567890'
  },
  {
    userId: 'doc001',
    role: 'doctor',
    password: 'password123',
    name: 'Dr. John Smith',
    email: 'john.smith@hms.com',
    phone: '+1234567891'
  },
  {
    userId: 'doc002',
    role: 'doctor',
    password: 'password123',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@hms.com',
    phone: '+1234567892'
  },
  {
    userId: 'pat001',
    role: 'patient',
    password: 'password123',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1234567893'
  },
  {
    userId: 'pat002',
    role: 'patient',
    password: 'password123',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+1234567894'
  }
];

const samplePatients = [
  {
    patientId: 'P00001',
    name: 'John Doe',
    age: 35,
    gender: 'male',
    contact: {
      phone: '+1234567893',
      email: 'john.doe@email.com',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    },
    bloodType: 'A+',
    emergencyContact: {
      name: 'Mary Doe',
      relationship: 'Spouse',
      phone: '+1234567895'
    }
  },
  {
    patientId: 'P00002',
    name: 'Jane Smith',
    age: 28,
    gender: 'female',
    contact: {
      phone: '+1234567894',
      email: 'jane.smith@email.com',
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      }
    },
    bloodType: 'O+',
    emergencyContact: {
      name: 'Bob Smith',
      relationship: 'Father',
      phone: '+1234567896'
    }
  }
];

const sampleDoctors = [
  {
    doctorId: 'D00001',
    name: 'Dr. John Smith',
    specialization: 'Cardiology',
    qualifications: [
      {
        degree: 'MD',
        institution: 'Harvard Medical School',
        year: 2010
      },
      {
        degree: 'Fellowship in Cardiology',
        institution: 'Johns Hopkins Hospital',
        year: 2015
      }
    ],
    contact: {
      phone: '+1234567891',
      email: 'john.smith@hms.com',
      address: {
        street: '789 Medical Center Dr',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      }
    },
    availability: {
      schedule: [
        { day: 'monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'friday', startTime: '09:00', endTime: '17:00', isAvailable: true }
      ],
      isOnLeave: false,
      leaveDates: []
    },
    consultationFee: 150,
    experience: {
      years: 12,
      description: 'Specialized in interventional cardiology and heart failure management'
    },
    languages: ['English', 'Spanish']
  },
  {
    doctorId: 'D00002',
    name: 'Dr. Sarah Johnson',
    specialization: 'Pediatrics',
    qualifications: [
      {
        degree: 'MD',
        institution: 'Stanford Medical School',
        year: 2012
      },
      {
        degree: 'Residency in Pediatrics',
        institution: 'Children\'s Hospital',
        year: 2016
      }
    ],
    contact: {
      phone: '+1234567892',
      email: 'sarah.johnson@hms.com',
      address: {
        street: '321 Pediatric Center',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90211',
        country: 'USA'
      }
    },
    availability: {
      schedule: [
        { day: 'monday', startTime: '08:00', endTime: '16:00', isAvailable: true },
        { day: 'tuesday', startTime: '08:00', endTime: '16:00', isAvailable: true },
        { day: 'wednesday', startTime: '08:00', endTime: '16:00', isAvailable: true },
        { day: 'thursday', startTime: '08:00', endTime: '16:00', isAvailable: true },
        { day: 'friday', startTime: '08:00', endTime: '16:00', isAvailable: true }
      ],
      isOnLeave: false,
      leaveDates: []
    },
    consultationFee: 120,
    experience: {
      years: 8,
      description: 'Specialized in pediatric care and child development'
    },
    languages: ['English', 'French']
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${userData.userId}`);
    }

    // Create patients
    const createdPatients = [];
    for (const patientData of samplePatients) {
      const patient = new Patient(patientData);
      await patient.save();
      createdPatients.push(patient);
      console.log(`Created patient: ${patientData.patientId}`);
    }

    // Create doctors
    const createdDoctors = [];
    for (const doctorData of sampleDoctors) {
      const doctor = new Doctor(doctorData);
      await doctor.save();
      createdDoctors.push(doctor);
      console.log(`Created doctor: ${doctorData.doctorId}`);
    }

    // Assign patients to doctors
    if (createdPatients.length > 0 && createdDoctors.length > 0) {
      createdPatients[0].assignedDoctor = createdDoctors[0]._id;
      createdPatients[1].assignedDoctor = createdDoctors[1]._id;
      await createdPatients[0].save();
      await createdPatients[1].save();
      console.log('Assigned patients to doctors');
    }

    // Create sample appointments
    const sampleAppointments = [
      {
        appointmentId: 'A00001',
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '10:00',
        reason: 'Regular checkup',
        fee: 150,
        status: 'confirmed'
      },
      {
        appointmentId: 'A00002',
        patientId: createdPatients[1]._id,
        doctorId: createdDoctors[1]._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        time: '14:00',
        reason: 'Follow-up consultation',
        fee: 120,
        status: 'scheduled'
      }
    ];

    for (const appointmentData of sampleAppointments) {
      const appointment = new Appointment(appointmentData);
      await appointment.save();
      console.log(`Created appointment: ${appointmentData.appointmentId}`);
    }

    // Create sample medical records
    const sampleMedicalRecords = [
      {
        recordId: 'MR00001',
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        date: new Date(),
        diagnosis: {
          primary: 'Hypertension',
          secondary: ['High blood pressure'],
          icd10Code: 'I10'
        },
        symptoms: [
          {
            symptom: 'Headache',
            severity: 'mild',
            duration: '2 days'
          }
        ],
        vitalSigns: {
          bloodPressure: { systolic: 140, diastolic: 90 },
          heartRate: 75,
          temperature: 98.6,
          weight: 70
        },
        notes: {
          subjective: 'Patient reports occasional headaches',
          objective: 'Blood pressure elevated, otherwise normal examination',
          assessment: 'Essential hypertension',
          plan: 'Prescribe antihypertensive medication and lifestyle modifications'
        },
        treatment: {
          medications: [
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              duration: '30 days',
              instructions: 'Take in the morning'
            }
          ],
          recommendations: [
            'Reduce salt intake',
            'Exercise regularly',
            'Monitor blood pressure daily'
          ]
        }
      }
    ];

    for (const recordData of sampleMedicalRecords) {
      const record = new MedicalRecord(recordData);
      await record.save();
      console.log(`Created medical record: ${recordData.recordId}`);
    }

    console.log('Database seeding completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin123 / password123');
    console.log('Doctor: doc001 / password123');
    console.log('Patient: pat001 / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase(); 
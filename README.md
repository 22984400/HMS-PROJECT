# Hospital Management System (HMS Pro)

A comprehensive Hospital Management System built with React.js frontend and Node.js/Express backend with MongoDB database.

## Features

### 🔐 Authentication & Authorization
- Role-based access control (Admin, Doctor, Patient)
- JWT token-based authentication
- Secure password hashing with bcrypt
- Session management

### 👥 User Management
- **Admin Portal**: Full system access and management
- **Doctor Portal**: Patient management, appointments, medical records
- **Patient Portal**: View appointments, medical records, prescriptions

### 🏥 Patient Management
- Add, update, and delete patient records
- Store comprehensive patient information (personal, medical, contact)
- Track medical history, allergies, and medications
- Generate unique patient IDs
- Assign patients to doctors

### 👨‍⚕️ Doctor Management
- Register and manage doctor profiles
- Store qualifications, specializations, and experience
- Manage availability schedules and leave dates
- Track consultation history
- Assign doctors to patients

### 📅 Appointment Management
- Create, update, and cancel appointments
- Check for scheduling conflicts
- Track appointment status (scheduled, confirmed, completed, etc.)
- Link appointments to patients and doctors
- Manage consultation fees

### 📋 Medical Records
- Comprehensive medical record management
- Store diagnoses, symptoms, vital signs
- Track treatment plans and medications
- Lab results and imaging records
- SOAP notes (Subjective, Objective, Assessment, Plan)

## Tech Stack

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls
- **CSS3** - Styling with custom components

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd huncho/react-app
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Database Setup
Make sure MongoDB is running on your system. The application will connect to `mongodb://localhost:27017/hms_database`.

### 4. Environment Configuration
The backend uses a `config.env` file in the `server` directory. Default configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hms_database
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 5. Seed the Database
```bash
cd server
npm run seed
```
This will create sample users, patients, doctors, appointments, and medical records.

### 6. Start the Application

#### Option 1: Start Both Frontend and Backend Together
```bash
npm run dev:full
```

#### Option 2: Start Separately
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Demo Credentials

After seeding the database, you can use these credentials to test the system:

### Admin Access
- **User ID**: admin123
- **Password**: password123
- **Features**: Full system access, user management, all CRUD operations

### Doctor Access
- **User ID**: doc001
- **Password**: password123
- **Features**: Patient management, appointments, medical records, schedule management

### Patient Access
- **User ID**: pat001
- **Password**: password123
- **Features**: View appointments, medical records, prescriptions, personal information

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id/medical-history` - Get patient medical history

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `GET /api/doctors/:id/schedule` - Get doctor schedule
- `PUT /api/doctors/:id/schedule` - Update doctor schedule

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment

### Medical Records
- `GET /api/medical-records` - Get all medical records
- `GET /api/medical-records/:id` - Get medical record by ID
- `POST /api/medical-records` - Create new medical record
- `PUT /api/medical-records/:id` - Update medical record
- `DELETE /api/medical-records/:id` - Delete medical record
- `GET /api/medical-records/patient/:patientId` - Get patient medical history
- `GET /api/medical-records/doctor/:doctorId` - Get doctor medical records

## Project Structure

```
react-app/
├── src/
│   ├── components/          # React components
│   │   ├── Login.jsx       # Login component
│   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   ├── Dashboard.jsx   # Admin dashboard
│   │   ├── PatientManagement.jsx
│   │   ├── DoctorManagement.jsx
│   │   ├── AppointmentManagement.jsx
│   │   └── MedicalRecordManagement.jsx
│   ├── services/
│   │   └── api.js          # API service functions
│   ├── App.jsx             # Main application component
│   ├── App.css             # Global styles
│   └── main.jsx            # Application entry point
├── server/
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   └── MedicalRecord.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── doctors.js
│   │   ├── appointments.js
│   │   └── medicalRecords.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── server.js           # Express server
│   ├── seed.js             # Database seeding script
│   └── config.env          # Environment variables
├── package.json
└── README.md
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Input Validation**: Express-validator for request validation
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: HTTP headers security middleware
- **Role-based Access**: Granular permission system

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

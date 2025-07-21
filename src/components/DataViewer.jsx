import React, { useState, useEffect } from 'react';
import { patientsAPI, doctorsAPI, authAPI, appointmentsAPI, medicalRecordsAPI } from '../services/api';

function DataViewer({ role }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all data based on user role
      if (role === 'admin') {
        const [patientsRes, doctorsRes, usersRes, appointmentsRes, recordsRes] = await Promise.all([
          patientsAPI.getAll({ limit: 100 }),
          doctorsAPI.getAll({ limit: 100 }),
          authAPI.getUsers(),
          appointmentsAPI.getAll({ limit: 100 }),
          medicalRecordsAPI.getAll({ limit: 100 })
        ]);

        setPatients(patientsRes.data.patients || []);
        setDoctors(doctorsRes.data.doctors || []);
        setUsers(usersRes.data.users || []);
        setAppointments(appointmentsRes.data.appointments || []);
        setMedicalRecords(recordsRes.data.records || []);
      } else if (role === 'doctor') {
        const [patientsRes, appointmentsRes, recordsRes] = await Promise.all([
          patientsAPI.getAll({ limit: 100 }),
          appointmentsAPI.getAll({ limit: 100 }),
          medicalRecordsAPI.getAll({ limit: 100 })
        ]);

        setPatients(patientsRes.data.patients || []);
        setAppointments(appointmentsRes.data.appointments || []);
        setMedicalRecords(recordsRes.data.records || []);
      } else if (role === 'patient') {
        const [appointmentsRes, recordsRes] = await Promise.all([
          appointmentsAPI.getAll({ limit: 100 }),
          medicalRecordsAPI.getAll({ limit: 100 })
        ]);

        setAppointments(appointmentsRes.data.appointments || []);
        setMedicalRecords(recordsRes.data.records || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPatientDetails = (patient) => (
    <div className="detail-view">
      <h3>Patient Details: {patient.name}</h3>
      <div className="detail-grid">
        <div className="detail-section">
          <h4>Basic Information</h4>
          <p><strong>Patient ID:</strong> {patient.patientId}</p>
          <p><strong>Name:</strong> {patient.name}</p>
          <p><strong>Age:</strong> {patient.age}</p>
          <p><strong>Gender:</strong> {patient.gender}</p>
          <p><strong>Blood Type:</strong> {patient.bloodType}</p>
          <p><strong>Status:</strong> {patient.isActive ? 'Active' : 'Inactive'}</p>
        </div>

        <div className="detail-section">
          <h4>Contact Information</h4>
          <p><strong>Phone:</strong> {patient.contact?.phone}</p>
          <p><strong>Email:</strong> {patient.contact?.email}</p>
          <p><strong>Address:</strong> {patient.contact?.address?.street}, {patient.contact?.address?.city}, {patient.contact?.address?.state} {patient.contact?.address?.zipCode}</p>
        </div>

        <div className="detail-section">
          <h4>Emergency Contact</h4>
          <p><strong>Name:</strong> {patient.emergencyContact?.name}</p>
          <p><strong>Relationship:</strong> {patient.emergencyContact?.relationship}</p>
          <p><strong>Phone:</strong> {patient.emergencyContact?.phone}</p>
        </div>

        <div className="detail-section">
          <h4>Insurance</h4>
          <p><strong>Provider:</strong> {patient.insurance?.provider}</p>
          <p><strong>Policy Number:</strong> {patient.insurance?.policyNumber}</p>
          <p><strong>Group Number:</strong> {patient.insurance?.groupNumber}</p>
          <p><strong>Expiry Date:</strong> {patient.insurance?.expiryDate ? new Date(patient.insurance.expiryDate).toLocaleDateString() : 'N/A'}</p>
        </div>

        {patient.medicalHistory && patient.medicalHistory.length > 0 && (
          <div className="detail-section">
            <h4>Medical History</h4>
            {patient.medicalHistory.map((history, index) => (
              <div key={index} className="history-item">
                <p><strong>Condition:</strong> {history.condition}</p>
                <p><strong>Diagnosis:</strong> {history.diagnosis}</p>
                <p><strong>Treatment:</strong> {history.treatment}</p>
                <p><strong>Date:</strong> {new Date(history.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {patient.allergies && patient.allergies.length > 0 && (
          <div className="detail-section">
            <h4>Allergies</h4>
            {patient.allergies.map((allergy, index) => (
              <div key={index} className="allergy-item">
                <p><strong>Allergen:</strong> {allergy.allergen}</p>
                <p><strong>Severity:</strong> {allergy.severity}</p>
                <p><strong>Notes:</strong> {allergy.notes}</p>
              </div>
            ))}
          </div>
        )}

        {patient.medications && patient.medications.length > 0 && (
          <div className="detail-section">
            <h4>Current Medications</h4>
            {patient.medications.map((med, index) => (
              <div key={index} className="medication-item">
                <p><strong>Name:</strong> {med.name}</p>
                <p><strong>Dosage:</strong> {med.dosage}</p>
                <p><strong>Frequency:</strong> {med.frequency}</p>
                <p><strong>Start Date:</strong> {med.startDate ? new Date(med.startDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>End Date:</strong> {med.endDate ? new Date(med.endDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDoctorDetails = (doctor) => (
    <div className="detail-view">
      <h3>Doctor Details: {doctor.name}</h3>
      <div className="detail-grid">
        <div className="detail-section">
          <h4>Basic Information</h4>
          <p><strong>Doctor ID:</strong> {doctor.doctorId}</p>
          <p><strong>Name:</strong> {doctor.name}</p>
          <p><strong>Specialization:</strong> {doctor.specialization}</p>
          <p><strong>Consultation Fee:</strong> ${doctor.consultationFee}</p>
          <p><strong>Status:</strong> {doctor.isActive ? 'Active' : 'Inactive'}</p>
        </div>

        <div className="detail-section">
          <h4>Contact Information</h4>
          <p><strong>Phone:</strong> {doctor.contact?.phone}</p>
          <p><strong>Email:</strong> {doctor.contact?.email}</p>
          <p><strong>Address:</strong> {doctor.contact?.address?.street}, {doctor.contact?.address?.city}, {doctor.contact?.address?.state} {doctor.contact?.address?.zipCode}</p>
        </div>

        <div className="detail-section">
          <h4>Experience</h4>
          <p><strong>Years of Experience:</strong> {doctor.experience?.years}</p>
          <p><strong>Description:</strong> {doctor.experience?.description}</p>
        </div>

        {doctor.qualifications && doctor.qualifications.length > 0 && (
          <div className="detail-section">
            <h4>Qualifications</h4>
            {doctor.qualifications.map((qual, index) => (
              <div key={index} className="qualification-item">
                <p><strong>Degree:</strong> {qual.degree}</p>
                <p><strong>Institution:</strong> {qual.institution}</p>
                <p><strong>Year:</strong> {qual.year}</p>
              </div>
            ))}
          </div>
        )}

        <div className="detail-section">
          <h4>Languages</h4>
          <p>{doctor.languages?.join(', ') || 'Not specified'}</p>
        </div>

        <div className="detail-section">
          <h4>Availability</h4>
          <p><strong>On Leave:</strong> {doctor.availability?.isOnLeave ? 'Yes' : 'No'}</p>
          {doctor.availability?.schedule && doctor.availability.schedule.length > 0 && (
            <div>
              <h5>Weekly Schedule:</h5>
              {doctor.availability.schedule.map((schedule, index) => (
                <div key={index} className="schedule-item">
                  <p><strong>{schedule.day}:</strong> {schedule.startTime} - {schedule.endTime} ({schedule.isAvailable ? 'Available' : 'Not Available'})</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {doctor.assignedPatients && doctor.assignedPatients.length > 0 && (
          <div className="detail-section">
            <h4>Assigned Patients ({doctor.assignedPatients.length})</h4>
            {doctor.assignedPatients.map((patient, index) => (
              <div key={index} className="patient-item">
                <p><strong>Name:</strong> {patient.name}</p>
                <p><strong>Patient ID:</strong> {patient.patientId}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderUserDetails = (user) => (
    <div className="detail-view">
      <h3>User Details: {user.name}</h3>
      <div className="detail-grid">
        <div className="detail-section">
          <h4>Account Information</h4>
          <p><strong>User ID:</strong> {user.userId}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
          <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );

  const renderAppointmentDetails = (appointment) => (
    <div className="detail-view">
      <h3>Appointment Details: {appointment.appointmentId}</h3>
      <div className="detail-grid">
        <div className="detail-section">
          <h4>Appointment Information</h4>
          <p><strong>Appointment ID:</strong> {appointment.appointmentId}</p>
          <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {appointment.time}</p>
          <p><strong>Duration:</strong> {appointment.duration} minutes</p>
          <p><strong>Status:</strong> {appointment.status}</p>
          <p><strong>Type:</strong> {appointment.type}</p>
          <p><strong>Priority:</strong> {appointment.priority}</p>
          <p><strong>Fee:</strong> ${appointment.fee}</p>
          <p><strong>Payment Status:</strong> {appointment.paymentStatus}</p>
        </div>

        <div className="detail-section">
          <h4>Patient Information</h4>
          <p><strong>Name:</strong> {appointment.patientId?.name}</p>
          <p><strong>Patient ID:</strong> {appointment.patientId?.patientId}</p>
          <p><strong>Age:</strong> {appointment.patientId?.age}</p>
          <p><strong>Gender:</strong> {appointment.patientId?.gender}</p>
        </div>

        <div className="detail-section">
          <h4>Doctor Information</h4>
          <p><strong>Name:</strong> {appointment.doctorId?.name}</p>
          <p><strong>Doctor ID:</strong> {appointment.doctorId?.doctorId}</p>
          <p><strong>Specialization:</strong> {appointment.doctorId?.specialization}</p>
        </div>

        <div className="detail-section">
          <h4>Additional Information</h4>
          <p><strong>Reason:</strong> {appointment.reason}</p>
          <p><strong>Notes:</strong> {appointment.notes || 'No notes'}</p>
          {appointment.symptoms && appointment.symptoms.length > 0 && (
            <p><strong>Symptoms:</strong> {appointment.symptoms.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderMedicalRecordDetails = (record) => (
    <div className="detail-view">
      <h3>Medical Record: {record.recordId}</h3>
      <div className="detail-grid">
        <div className="detail-section">
          <h4>Record Information</h4>
          <p><strong>Record ID:</strong> {record.recordId}</p>
          <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
          <p><strong>Status:</strong> {record.status}</p>
        </div>

        <div className="detail-section">
          <h4>Diagnosis</h4>
          <p><strong>Primary:</strong> {record.diagnosis?.primary}</p>
          <p><strong>Secondary:</strong> {record.diagnosis?.secondary?.join(', ') || 'None'}</p>
          <p><strong>ICD-10 Code:</strong> {record.diagnosis?.icd10Code || 'Not specified'}</p>
        </div>

        <div className="detail-section">
          <h4>Vital Signs</h4>
          {record.vitalSigns && (
            <>
              <p><strong>Blood Pressure:</strong> {record.vitalSigns.bloodPressure?.systolic}/{record.vitalSigns.bloodPressure?.diastolic} mmHg</p>
              <p><strong>Heart Rate:</strong> {record.vitalSigns.heartRate} bpm</p>
              <p><strong>Temperature:</strong> {record.vitalSigns.temperature}°F</p>
              <p><strong>Weight:</strong> {record.vitalSigns.weight} kg</p>
            </>
          )}
        </div>

        <div className="detail-section">
          <h4>SOAP Notes</h4>
          <p><strong>Subjective:</strong> {record.notes?.subjective || 'Not recorded'}</p>
          <p><strong>Objective:</strong> {record.notes?.objective || 'Not recorded'}</p>
          <p><strong>Assessment:</strong> {record.notes?.assessment || 'Not recorded'}</p>
          <p><strong>Plan:</strong> {record.notes?.plan || 'Not recorded'}</p>
        </div>

        {record.treatment && (
          <div className="detail-section">
            <h4>Treatment</h4>
            {record.treatment.medications && record.treatment.medications.length > 0 && (
              <div>
                <h5>Medications:</h5>
                {record.treatment.medications.map((med, index) => (
                  <div key={index} className="medication-item">
                    <p><strong>Name:</strong> {med.name}</p>
                    <p><strong>Dosage:</strong> {med.dosage}</p>
                    <p><strong>Frequency:</strong> {med.frequency}</p>
                    <p><strong>Instructions:</strong> {med.instructions}</p>
                  </div>
                ))}
              </div>
            )}
            {record.treatment.recommendations && record.treatment.recommendations.length > 0 && (
              <div>
                <h5>Recommendations:</h5>
                <ul>
                  {record.treatment.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="data-viewer">
      <div className="viewer-header">
        <h2>Data Viewer - {role.charAt(0).toUpperCase() + role.slice(1)} Portal</h2>
        <p>View all stored information in the system</p>
      </div>

      <div className="viewer-tabs">
        {role === 'admin' && (
          <>
            <button 
              className={`tab ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveTab('patients')}
            >
              Patients ({patients.length})
            </button>
            <button 
              className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              Doctors ({doctors.length})
            </button>
            <button 
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users ({users.length})
            </button>
          </>
        )}
        {(role === 'admin' || role === 'doctor') && (
          <button 
            className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments ({appointments.length})
          </button>
        )}
        {(role === 'admin' || role === 'doctor' || role === 'patient') && (
          <button 
            className={`tab ${activeTab === 'medical-records' ? 'active' : ''}`}
            onClick={() => setActiveTab('medical-records')}
          >
            Medical Records ({medicalRecords.length})
          </button>
        )}
      </div>

      <div className="viewer-content">
        {selectedItem ? (
          <div className="detail-container">
            <button className="back-btn" onClick={() => setSelectedItem(null)}>
              ← Back to List
            </button>
            {activeTab === 'patients' && renderPatientDetails(selectedItem)}
            {activeTab === 'doctors' && renderDoctorDetails(selectedItem)}
            {activeTab === 'users' && renderUserDetails(selectedItem)}
            {activeTab === 'appointments' && renderAppointmentDetails(selectedItem)}
            {activeTab === 'medical-records' && renderMedicalRecordDetails(selectedItem)}
          </div>
        ) : (
          <div className="list-container">
            {activeTab === 'patients' && (
              <div className="data-list">
                <h3>All Patients</h3>
                {patients.map(patient => (
                  <div key={patient._id} className="list-item" onClick={() => setSelectedItem(patient)}>
                    <div className="item-header">
                      <h4>{patient.name}</h4>
                      <span className="item-id">{patient.patientId}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>Age:</strong> {patient.age} | <strong>Gender:</strong> {patient.gender} | <strong>Blood Type:</strong> {patient.bloodType}</p>
                      <p><strong>Phone:</strong> {patient.contact?.phone} | <strong>Email:</strong> {patient.contact?.email}</p>
                      <p><strong>Status:</strong> {patient.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="data-list">
                <h3>All Doctors</h3>
                {doctors.map(doctor => (
                  <div key={doctor._id} className="list-item" onClick={() => setSelectedItem(doctor)}>
                    <div className="item-header">
                      <h4>{doctor.name}</h4>
                      <span className="item-id">{doctor.doctorId}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>Specialization:</strong> {doctor.specialization} | <strong>Experience:</strong> {doctor.experience?.years} years</p>
                      <p><strong>Phone:</strong> {doctor.contact?.phone} | <strong>Email:</strong> {doctor.contact?.email}</p>
                      <p><strong>Consultation Fee:</strong> ${doctor.consultationFee} | <strong>Status:</strong> {doctor.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="data-list">
                <h3>All Users</h3>
                {users.map(user => (
                  <div key={user._id} className="list-item" onClick={() => setSelectedItem(user)}>
                    <div className="item-header">
                      <h4>{user.name}</h4>
                      <span className="item-id">{user.userId}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>Role:</strong> {user.role} | <strong>Email:</strong> {user.email}</p>
                      <p><strong>Phone:</strong> {user.phone} | <strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
                      <p><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="data-list">
                <h3>All Appointments</h3>
                {appointments.map(appointment => (
                  <div key={appointment._id} className="list-item" onClick={() => setSelectedItem(appointment)}>
                    <div className="item-header">
                      <h4>{appointment.appointmentId}</h4>
                      <span className={`status ${appointment.status}`}>{appointment.status}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>Patient:</strong> {appointment.patientId?.name} | <strong>Doctor:</strong> {appointment.doctorId?.name}</p>
                      <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()} | <strong>Time:</strong> {appointment.time}</p>
                      <p><strong>Reason:</strong> {appointment.reason} | <strong>Fee:</strong> ${appointment.fee}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'medical-records' && (
              <div className="data-list">
                <h3>All Medical Records</h3>
                {medicalRecords.map(record => (
                  <div key={record._id} className="list-item" onClick={() => setSelectedItem(record)}>
                    <div className="item-header">
                      <h4>{record.recordId}</h4>
                      <span className={`status ${record.status}`}>{record.status}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>Patient:</strong> {record.patientId?.name} | <strong>Doctor:</strong> {record.doctorId?.name}</p>
                      <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()} | <strong>Diagnosis:</strong> {record.diagnosis?.primary}</p>
                      <p><strong>Status:</strong> {record.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DataViewer; 
import React, { useState, useEffect } from 'react';
import { appointmentsAPI, doctorsAPI, patientsAPI, refreshUtils } from '../services/api';

const initialForm = {
  patientId: '',
  doctorId: '',
  date: '',
  time: '',
  reason: '',
  type: 'consultation',
  priority: 'normal',
  symptoms: []
};

function AppointmentManagement({ role = 'admin', userId = null }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);

  const symptomOptions = [
    'Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 'Dizziness',
    'Chest Pain', 'Shortness of Breath', 'Abdominal Pain', 'Joint Pain',
    'Rash', 'Swelling', 'Bleeding', 'Vision Problems', 'Hearing Problems'
  ];

  useEffect(() => {
    loadData();
    
    // Start auto-refresh
    const interval = refreshUtils.startAutoRefresh();
    setAutoRefreshInterval(interval);

    // Listen for data refresh events
    const handleDataRefresh = () => {
      loadData();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);

    // Cleanup on unmount
    return () => {
      if (autoRefreshInterval) {
        refreshUtils.stopAutoRefresh(autoRefreshInterval);
      }
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, [role, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load appointments based on role
      let appointmentsRes;
      if (role === 'admin') {
        appointmentsRes = await appointmentsAPI.getAll();
      } else if (role === 'doctor') {
        appointmentsRes = await appointmentsAPI.getByDoctor(userId);
      } else if (role === 'patient') {
        appointmentsRes = await appointmentsAPI.getByPatient(userId);
      }

      setAppointments(appointmentsRes.data.appointments || []);

      // Load doctors for appointment booking
      if (role === 'admin' || role === 'patient') {
        const doctorsRes = await doctorsAPI.getAll();
        setDoctors(doctorsRes.data.doctors || []);
      }

      // Load patients for admin and doctor views
      if (role === 'admin' || role === 'doctor') {
        const patientsRes = await patientsAPI.getAll();
        setPatients(patientsRes.data.patients || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const appointmentData = {
        ...form,
        symptoms: selectedSymptoms,
        patientId: role === 'patient' ? userId : form.patientId
      };

      if (editingId) {
        await appointmentsAPI.update(editingId, appointmentData);
        setSuccess('Appointment updated successfully!');
      } else {
        await appointmentsAPI.create(appointmentData);
        setSuccess('Appointment created successfully!');
      }

      setForm(initialForm);
      setSelectedSymptoms([]);
      setEditingId(null);
      
      // Refresh data immediately after successful operation
      await loadData();
      
      // Trigger manual refresh for other components
      refreshUtils.triggerRefresh();
      
    } catch (error) {
      console.error('Error saving appointment:', error);
      setError(error.response?.data?.message || 'Failed to save appointment. Please try again.');
    }
  };

  const handleEdit = (appointment) => {
    setForm({
      patientId: appointment.patientId?._id || appointment.patientId,
      doctorId: appointment.doctorId?._id || appointment.doctorId,
      date: appointment.date.split('T')[0],
      time: appointment.time,
      reason: appointment.reason,
      type: appointment.type,
      priority: appointment.priority
    });
    setSelectedSymptoms(appointment.symptoms || []);
    setEditingId(appointment._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentsAPI.delete(id);
        setSuccess('Appointment deleted successfully!');
        
        // Refresh data immediately after successful operation
        await loadData();
        
        // Trigger manual refresh for other components
        refreshUtils.triggerRefresh();
        
      } catch (error) {
        console.error('Error deleting appointment:', error);
        setError('Failed to delete appointment. Please try again.');
      }
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentsAPI.update(id, { status });
      setSuccess('Appointment status updated successfully!');
      
      // Refresh data immediately after successful operation
      await loadData();
      
      // Trigger manual refresh for other components
      refreshUtils.triggerRefresh();
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update appointment status. Please try again.');
    }
  };

  const getFilteredAppointments = () => {
    if (role === 'doctor') {
      return appointments.filter(apt => apt.doctorId?._id === userId || apt.doctorId === userId);
    } else if (role === 'patient') {
      return appointments.filter(apt => apt.patientId?._id === userId || apt.patientId === userId);
    }
    return appointments;
  };

  const getPatientName = (patientId) => {
    if (typeof patientId === 'object') return patientId.name;
    const patient = patients.find(p => p._id === patientId);
    return patient ? patient.name : patientId;
  };

  const getDoctorName = (doctorId) => {
    if (typeof doctorId === 'object') return doctorId.name;
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? doctor.name : doctorId;
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="content-area">
      <div className="content-header">
        <h1>Appointment Management</h1>
        <p>{role.charAt(0).toUpperCase() + role.slice(1)} Portal - Manage appointments</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Appointment Booking Form - Only for patients and admins */}
      {(role === 'admin' || role === 'patient') && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>{editingId ? 'Edit Appointment' : 'Book New Appointment'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-grid">
              {role === 'admin' && (
                <div className="form-group">
                  <label>Patient *</label>
                  <select 
                    name="patientId" 
                    value={form.patientId} 
                    onChange={handleChange} 
                    required 
                    className="form-control"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} ({patient.patientId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Doctor *</label>
                <select 
                  name="doctorId" 
                  value={form.doctorId} 
                  onChange={handleChange} 
                  required 
                  className="form-control"
                >
                  <option value="">Select Doctor</option>
                  {doctors.filter(doctor => doctor.isActive).map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input 
                  name="date" 
                  value={form.date} 
                  onChange={handleChange} 
                  type="date" 
                  required 
                  className="form-control"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input 
                  name="time" 
                  value={form.time} 
                  onChange={handleChange} 
                  type="time" 
                  required 
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleChange} className="form-control">
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="routine">Routine Check</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="form-control">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Visit *</label>
              <textarea 
                name="reason" 
                value={form.reason} 
                onChange={handleChange} 
                placeholder="Describe the reason for your appointment..."
                required 
                className="form-control"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Symptoms (Select all that apply)</label>
              <div className="symptoms-grid">
                {symptomOptions.map(symptom => (
                  <label key={symptom} className="symptom-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                    />
                    {symptom}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Appointment' : 'Book Appointment'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { 
                    setForm(initialForm); 
                    setSelectedSymptoms([]);
                    setEditingId(null); 
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      <div className="card">
        <div className="card-header">
          <h3>Appointments</h3>
          <span className="appointment-count">{getFilteredAppointments().length} appointment(s)</span>
        </div>
        <div className="card-body">
          {getFilteredAppointments().length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>No appointments found.</p>
            </div>
          ) : (
            <div className="appointments-grid">
              {getFilteredAppointments().map((appointment) => (
                <div key={appointment._id} className="appointment-card">
                  <div className="appointment-header">
                    <h4>{appointment.appointmentId}</h4>
                    <span className={`status ${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="appointment-details">
                    <div className="detail-row">
                      <strong>Patient:</strong> {getPatientName(appointment.patientId)}
                    </div>
                    <div className="detail-row">
                      <strong>Doctor:</strong> {getDoctorName(appointment.doctorId)}
                    </div>
                    <div className="detail-row">
                      <strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div className="detail-row">
                      <strong>Time:</strong> {appointment.time}
                    </div>
                    <div className="detail-row">
                      <strong>Type:</strong> {appointment.type}
                    </div>
                    <div className="detail-row">
                      <strong>Priority:</strong> {appointment.priority}
                    </div>
                    <div className="detail-row">
                      <strong>Reason:</strong> {appointment.reason}
                    </div>
                    {appointment.symptoms && appointment.symptoms.length > 0 && (
                      <div className="detail-row">
                        <strong>Symptoms:</strong> {appointment.symptoms.join(', ')}
                      </div>
                    )}
                    <div className="detail-row">
                      <strong>Fee:</strong> ${appointment.fee || 'Not set'}
                    </div>
                  </div>

                  <div className="appointment-actions">
                    {(role === 'admin' || role === 'doctor') && (
                      <select 
                        value={appointment.status} 
                        onChange={(e) => handleStatusUpdate(appointment._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                    
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => handleEdit(appointment)}
                    >
                      Edit
                    </button>
                    
                    {(role === 'admin' || appointment.status === 'scheduled') && (
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(appointment._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentManagement; 
import React, { useState, useEffect } from 'react';
import { doctorsAPI } from '../services/api';

const initialForm = {
  name: '',
  specialization: '',
  contact: {
    phone: '',
    email: ''
  },
  consultationFee: '',
  experience: {
    years: '',
    description: ''
  },
  languages: '',
  availability: {
    schedule: [
      { day: 'monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'saturday', startTime: '09:00', endTime: '13:00', isAvailable: false },
      { day: 'sunday', startTime: '09:00', endTime: '13:00', isAvailable: false }
    ]
  }
};

function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorsAPI.getAll();
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const doctorData = {
        ...form,
        languages: form.languages ? form.languages.split(',').map(lang => lang.trim()) : [],
        experience: {
          years: parseInt(form.experience.years) || 0,
          description: form.experience.description || ''
        }
      };

      if (editingId) {
        await doctorsAPI.update(editingId, doctorData);
        setSuccess('Doctor updated successfully!');
      } else {
        await doctorsAPI.create(doctorData);
        setSuccess('Doctor created successfully!');
      }

      setForm(initialForm);
      setEditingId(null);
      loadDoctors();
    } catch (error) {
      console.error('Error saving doctor:', error);
      setError(error.response?.data?.message || 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setForm({
      name: doctor.name,
      specialization: doctor.specialization,
      contact: {
        phone: doctor.contact?.phone || '',
        email: doctor.contact?.email || ''
      },
      consultationFee: doctor.consultationFee || '',
      experience: {
        years: doctor.experience?.years || '',
        description: doctor.experience?.description || ''
      },
      languages: doctor.languages ? doctor.languages.join(', ') : '',
      availability: doctor.availability || initialForm.availability
    });
    setEditingId(doctor._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) {
      return;
    }

    try {
      setLoading(true);
      await doctorAPI.delete(id);
      setSuccess('Doctor deleted successfully!');
      loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setError('Failed to delete doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="content-area">
      <h1>Doctor Management</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3>{editingId ? 'Edit Doctor' : 'Register New Doctor'}</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label>Name *</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="Full Name" 
                required 
                className="form-control" 
              />
            </div>
            
            <div>
              <label>Specialization *</label>
              <input 
                name="specialization" 
                value={form.specialization} 
                onChange={handleChange} 
                placeholder="e.g., Cardiology, Neurology" 
                required 
                className="form-control" 
              />
            </div>
            
            <div>
              <label>Phone *</label>
              <input 
                name="contact.phone" 
                value={form.contact.phone} 
                onChange={handleChange} 
                placeholder="Phone Number" 
                required 
                className="form-control" 
              />
            </div>
            
            <div>
              <label>Email *</label>
              <input 
                name="contact.email" 
                value={form.contact.email} 
                onChange={handleChange} 
                type="email"
                placeholder="Email Address" 
                required 
                className="form-control" 
              />
            </div>
            
            <div>
              <label>Consultation Fee *</label>
              <input 
                name="consultationFee" 
                value={form.consultationFee} 
                onChange={handleChange} 
                type="number"
                min="0"
                step="0.01"
                placeholder="Fee Amount" 
                required 
                className="form-control" 
              />
            </div>
            
            <div>
              <label>Years of Experience</label>
              <input 
                name="experience.years" 
                value={form.experience.years} 
                onChange={handleChange} 
                type="number"
                min="0"
                placeholder="Years" 
                className="form-control" 
              />
            </div>
            
            <div>
              <label>Languages (comma-separated)</label>
              <input 
                name="languages" 
                value={form.languages} 
                onChange={handleChange} 
                placeholder="e.g., English, French, Spanish" 
                className="form-control" 
              />
            </div>
            
            <div>
              <label>Experience Description</label>
              <textarea 
                name="experience.description" 
                value={form.experience.description} 
                onChange={handleChange} 
                placeholder="Brief description of experience" 
                className="form-control" 
                rows="3"
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (editingId ? 'Update Doctor' : 'Register Doctor')}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }} onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <div className="card-header">
          <h3>Doctor Profiles</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading doctors...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Contact</th>
                  <th>Fee</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center' }}>No doctors found.</td></tr>
                ) : (
                  doctors.map((doctor) => (
                    <tr key={doctor._id}>
                      <td>{doctor.doctorId}</td>
                      <td>{doctor.name}</td>
                      <td>{doctor.specialization}</td>
                      <td>
                        <div>📞 {doctor.contact?.phone}</div>
                        <div>📧 {doctor.contact?.email}</div>
                      </td>
                      <td>${doctor.consultationFee}</td>
                      <td>{doctor.experience?.years || 0} years</td>
                      <td>
                        <span className={`badge ${doctor.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => handleEdit(doctor)} 
                          style={{ marginRight: '0.5rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDelete(doctor._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorManagement; 
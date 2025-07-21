import React, { useState, useEffect } from 'react';
import { patientsAPI, doctorsAPI, refreshUtils } from '../services/api';

const initialForm = {
  name: '',
  age: '',
  gender: 'male',
  contact: {
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  },
  bloodType: 'A+',
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  },
  insurance: {
    provider: '',
    policyNumber: '',
    groupNumber: '',
    expiryDate: ''
  }
};

function PatientManagement({ role = 'admin', userId = null }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);

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

      // Load patients based on role
      let patientsRes;
      if (role === 'admin') {
        patientsRes = await patientsAPI.getAll();
      } else if (role === 'doctor') {
        patientsRes = await patientsAPI.getByDoctor(userId);
      }

      setPatients(patientsRes.data.patients || []);

      // Load doctors for admin to assign patients
      if (role === 'admin') {
        const doctorsRes = await doctorsAPI.getAll();
        setDoctors(doctorsRes.data.doctors || []);
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
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name.includes('address.')) {
      const field = name.split('address.')[1];
      setForm(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          address: {
            ...prev.contact.address,
            [field]: value
          }
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (editingId) {
        await patientsAPI.update(editingId, form);
        setSuccess('Patient updated successfully!');
      } else {
        await patientsAPI.create(form);
        setSuccess('Patient created successfully!');
      }

      setForm(initialForm);
      setEditingId(null);
      
      // Refresh data immediately after successful operation
      await loadData();
      
      // Trigger manual refresh for other components
      refreshUtils.triggerRefresh();
      
    } catch (error) {
      console.error('Error saving patient:', error);
      setError(error.response?.data?.message || 'Failed to save patient. Please try again.');
    }
  };

  const handleEdit = (patient) => {
    setForm({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: {
        phone: patient.contact?.phone || '',
        email: patient.contact?.email || '',
        address: {
          street: patient.contact?.address?.street || '',
          city: patient.contact?.address?.city || '',
          state: patient.contact?.address?.state || '',
          zipCode: patient.contact?.address?.zipCode || '',
          country: patient.contact?.address?.country || ''
        }
      },
      bloodType: patient.bloodType,
      emergencyContact: {
        name: patient.emergencyContact?.name || '',
        relationship: patient.emergencyContact?.relationship || '',
        phone: patient.emergencyContact?.phone || ''
      },
      insurance: {
        provider: patient.insurance?.provider || '',
        policyNumber: patient.insurance?.policyNumber || '',
        groupNumber: patient.insurance?.groupNumber || '',
        expiryDate: patient.insurance?.expiryDate ? patient.insurance.expiryDate.split('T')[0] : ''
      }
    });
    setEditingId(patient._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientsAPI.delete(id);
        setSuccess('Patient deleted successfully!');
        
        // Refresh data immediately after successful operation
        await loadData();
        
        // Trigger manual refresh for other components
        refreshUtils.triggerRefresh();
        
      } catch (error) {
        console.error('Error deleting patient:', error);
        setError('Failed to delete patient. Please try again.');
      }
    }
  };

  const handleAssignDoctor = async (patientId, doctorId) => {
    try {
      await patientsAPI.update(patientId, { assignedDoctor: doctorId });
      setSuccess('Doctor assigned successfully!');
      
      // Refresh data immediately after successful operation
      await loadData();
      
      // Trigger manual refresh for other components
      refreshUtils.triggerRefresh();
      
    } catch (error) {
      console.error('Error assigning doctor:', error);
      setError('Failed to assign doctor. Please try again.');
    }
  };

  const getFilteredPatients = () => {
    let filtered = patients;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contact?.phone?.includes(searchTerm) ||
        patient.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(patient => 
        filterStatus === 'active' ? patient.isActive : !patient.isActive
      );
    }

    return filtered;
  };

  const getDoctorName = (doctorId) => {
    if (!doctorId) return 'Not assigned';
    if (typeof doctorId === 'object') return `Dr. ${doctorId.name}`;
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? `Dr. ${doctor.name}` : 'Unknown Doctor';
  };

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

  return (
    <div className="content-area">
      <div className="content-header">
        <h1>Patient Management</h1>
        <p>{role.charAt(0).toUpperCase() + role.slice(1)} Portal - Manage patients</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Patient Creation Form - Only for admins */}
      {role === 'admin' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>{editingId ? 'Edit Patient' : 'Add New Patient'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Enter patient's full name"
                />
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  required
                  min="0"
                  max="150"
                  className="form-control"
                  placeholder="Enter age"
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="form-control">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Blood Type *</label>
                <select name="bloodType" value={form.bloodType} onChange={handleChange} className="form-control">
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  name="contact.phone"
                  value={form.contact.phone}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="contact.email"
                  type="email"
                  value={form.contact.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Address Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    name="address.street"
                    value={form.contact.address.street}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter street address"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    name="address.city"
                    value={form.contact.address.city}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter city"
                  />
                </div>

                <div className="form-group">
                  <label>State/Province</label>
                  <input
                    name="address.state"
                    value={form.contact.address.state}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter state/province"
                  />
                </div>

                <div className="form-group">
                  <label>ZIP/Postal Code</label>
                  <input
                    name="address.zipCode"
                    value={form.contact.address.zipCode}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter ZIP/postal code"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    name="address.country"
                    value={form.contact.address.country}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Emergency Contact</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    name="emergencyContact.name"
                    value={form.emergencyContact.name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter emergency contact name"
                  />
                </div>

                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    name="emergencyContact.relationship"
                    value={form.emergencyContact.relationship}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>

                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    name="emergencyContact.phone"
                    value={form.emergencyContact.phone}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Insurance Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Insurance Provider</label>
                  <input
                    name="insurance.provider"
                    value={form.insurance.provider}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter insurance provider"
                  />
                </div>

                <div className="form-group">
                  <label>Policy Number</label>
                  <input
                    name="insurance.policyNumber"
                    value={form.insurance.policyNumber}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter policy number"
                  />
                </div>

                <div className="form-group">
                  <label>Group Number</label>
                  <input
                    name="insurance.groupNumber"
                    value={form.insurance.groupNumber}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter group number"
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    name="insurance.expiryDate"
                    type="date"
                    value={form.insurance.expiryDate}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Patient' : 'Add Patient'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setForm(initialForm);
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

      {/* Search and Filter */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div className="search-filter">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search patients by name, ID, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
            {role === 'admin' && (
              <div className="filter-box">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="all">All Patients</option>
                  <option value="active">Active Patients</option>
                  <option value="inactive">Inactive Patients</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="card">
        <div className="card-header">
          <h3>Patients</h3>
          <span className="patient-count">{getFilteredPatients().length} patient(s)</span>
        </div>
        <div className="card-body">
          {getFilteredPatients().length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-injured"></i>
              <p>No patients found.</p>
            </div>
          ) : (
            <div className="patients-grid">
              {getFilteredPatients().map((patient) => (
                <div key={patient._id} className="patient-card">
                  <div className="patient-header">
                    <h4>{patient.name}</h4>
                    <span className="patient-id">{patient.patientId}</span>
                  </div>

                  <div className="patient-details">
                    <div className="detail-row">
                      <strong>Age:</strong> {patient.age} years
                    </div>
                    <div className="detail-row">
                      <strong>Gender:</strong> {patient.gender}
                    </div>
                    <div className="detail-row">
                      <strong>Blood Type:</strong> {patient.bloodType}
                    </div>
                    <div className="detail-row">
                      <strong>Phone:</strong> {patient.contact?.phone}
                    </div>
                    <div className="detail-row">
                      <strong>Email:</strong> {patient.contact?.email || 'Not provided'}
                    </div>
                    <div className="detail-row">
                      <strong>Status:</strong> 
                      <span className={`status ${patient.isActive ? 'active' : 'inactive'}`}>
                        {patient.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {role === 'admin' && (
                      <div className="detail-row">
                        <strong>Assigned Doctor:</strong> {getDoctorName(patient.assignedDoctor)}
                      </div>
                    )}
                  </div>

                  <div className="patient-actions">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      View Details
                    </button>

                    {role === 'admin' && (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEdit(patient)}
                        >
                          Edit
                        </button>

                        <select
                          value={patient.assignedDoctor?._id || patient.assignedDoctor || ''}
                          onChange={(e) => handleAssignDoctor(patient._id, e.target.value)}
                          className="doctor-select"
                        >
                          <option value="">Assign Doctor</option>
                          {doctors.filter(doctor => doctor.isActive).map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                              Dr. {doctor.name} - {doctor.specialization}
                            </option>
                          ))}
                        </select>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(patient._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details: {selectedPatient.name}</h3>
              <button className="close-btn" onClick={() => setSelectedPatient(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
                  <p><strong>Name:</strong> {selectedPatient.name}</p>
                  <p><strong>Age:</strong> {selectedPatient.age} years</p>
                  <p><strong>Gender:</strong> {selectedPatient.gender}</p>
                  <p><strong>Blood Type:</strong> {selectedPatient.bloodType}</p>
                  <p><strong>Status:</strong> {selectedPatient.isActive ? 'Active' : 'Inactive'}</p>
                </div>

                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <p><strong>Phone:</strong> {selectedPatient.contact?.phone}</p>
                  <p><strong>Email:</strong> {selectedPatient.contact?.email || 'Not provided'}</p>
                  <p><strong>Address:</strong> {selectedPatient.contact?.address?.street}, {selectedPatient.contact?.address?.city}, {selectedPatient.contact?.address?.state} {selectedPatient.contact?.address?.zipCode}</p>
                </div>

                <div className="detail-section">
                  <h4>Emergency Contact</h4>
                  <p><strong>Name:</strong> {selectedPatient.emergencyContact?.name || 'Not provided'}</p>
                  <p><strong>Relationship:</strong> {selectedPatient.emergencyContact?.relationship || 'Not provided'}</p>
                  <p><strong>Phone:</strong> {selectedPatient.emergencyContact?.phone || 'Not provided'}</p>
                </div>

                <div className="detail-section">
                  <h4>Insurance</h4>
                  <p><strong>Provider:</strong> {selectedPatient.insurance?.provider || 'Not provided'}</p>
                  <p><strong>Policy Number:</strong> {selectedPatient.insurance?.policyNumber || 'Not provided'}</p>
                  <p><strong>Group Number:</strong> {selectedPatient.insurance?.groupNumber || 'Not provided'}</p>
                  <p><strong>Expiry Date:</strong> {selectedPatient.insurance?.expiryDate ? new Date(selectedPatient.insurance.expiryDate).toLocaleDateString() : 'Not provided'}</p>
                </div>

                {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
                  <div className="detail-section">
                    <h4>Medical History</h4>
                    {selectedPatient.medicalHistory.map((history, index) => (
                      <div key={index} className="history-item">
                        <p><strong>Condition:</strong> {history.condition}</p>
                        <p><strong>Diagnosis:</strong> {history.diagnosis}</p>
                        <p><strong>Treatment:</strong> {history.treatment}</p>
                        <p><strong>Date:</strong> {new Date(history.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                  <div className="detail-section">
                    <h4>Allergies</h4>
                    {selectedPatient.allergies.map((allergy, index) => (
                      <div key={index} className="allergy-item">
                        <p><strong>Allergen:</strong> {allergy.allergen}</p>
                        <p><strong>Severity:</strong> {allergy.severity}</p>
                        <p><strong>Notes:</strong> {allergy.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientManagement; 
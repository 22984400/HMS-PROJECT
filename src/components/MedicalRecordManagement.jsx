import React, { useState } from 'react';

const initialForm = {
  patientId: '',
  doctorId: '',
  appointmentId: '',
  date: '',
  diagnosis: '',
  notes: '',
};

function generateRecordId() {
  return 'MR' + Math.floor(10000 + Math.random() * 90000);
}

function MedicalRecordManagement() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === editingId ? { ...form, id: editingId } : r))
      );
      setEditingId(null);
    } else {
      setRecords((prev) => [
        ...prev,
        { ...form, id: generateRecordId() },
      ]);
    }
    setForm(initialForm);
  };

  const handleEdit = (id) => {
    const rec = records.find((r) => r.id === id);
    setForm(rec);
    setEditingId(id);
  };

  const handleDelete = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) {
      setForm(initialForm);
      setEditingId(null);
    }
  };

  return (
    <div className="content-area">
      <h1>Medical Record Management</h1>
      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3>{editingId ? 'Edit Medical Record' : 'Create New Medical Record'}</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <input name="patientId" value={form.patientId} onChange={handleChange} placeholder="Patient ID" required className="form-control" style={{ flex: '1 1 120px' }} />
          <input name="doctorId" value={form.doctorId} onChange={handleChange} placeholder="Doctor ID" required className="form-control" style={{ flex: '1 1 120px' }} />
          <input name="appointmentId" value={form.appointmentId} onChange={handleChange} placeholder="Appointment ID" required className="form-control" style={{ flex: '1 1 120px' }} />
          <input name="date" value={form.date} onChange={handleChange} type="date" required className="form-control" style={{ flex: '1 1 140px' }} />
          <input name="diagnosis" value={form.diagnosis} onChange={handleChange} placeholder="Diagnosis" className="form-control" style={{ flex: '2 1 200px' }} />
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="form-control" style={{ flex: '2 1 200px' }} />
        </div>
        <div className="card-body">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update Record' : 'Create Record'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }} onClick={() => { setForm(initialForm); setEditingId(null); }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="card">
        <div className="card-header">
          <h3>Medical Records</h3>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient ID</th>
                <th>Doctor ID</th>
                <th>Appointment ID</th>
                <th>Date</th>
                <th>Diagnosis</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center' }}>No records found.</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.patientId}</td>
                    <td>{r.doctorId}</td>
                    <td>{r.appointmentId}</td>
                    <td>{r.date}</td>
                    <td>{r.diagnosis}</td>
                    <td>{r.notes}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleEdit(r.id)} style={{ marginRight: '0.5rem' }}>Edit</button>
                      <button className="btn btn-secondary" onClick={() => handleDelete(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MedicalRecordManagement; 
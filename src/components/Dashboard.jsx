import React from 'react';

function Dashboard({ onSectionChange }) {
  const handleQuickAction = (action) => {
    switch (action) {
      case 'newPatient':
        onSectionChange('patients');
        break;
      case 'newAppointment':
        onSectionChange('appointments');
        break;
      case 'addMedicine':
        onSectionChange('pharmacy');
        break;
      case 'generateBill':
        onSectionChange('billing');
        break;
      default:
        break;
    }
  };

  return (
    <div className="content-area" id="dashboard" data-role="admin">
      <h1>Admin Dashboard</h1>
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#4e73df' }}>
            <i className="fas fa-user-injured"></i>
          </div>
          <div className="stat-info">
            <h3>Total Patients</h3>
            <p id="total-patients">1,250</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#1cc88a' }}>
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-info">
            <h3>Doctors</h3>
            <p id="total-doctors">45</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#36b9cc' }}>
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>Today's Appointments</h3>
            <p id="today-appointments">28</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f6c23e' }}>
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <p id="total-revenue">$125,000</p>
          </div>
        </div>
      </div>
      <div className="content-row">
        <div className="content-col">
          <div className="card">
            <div className="card-header">
              <h3>Recent Appointments</h3>
              <button className="btn btn-primary" onClick={() => onSectionChange('appointments')}>View All</button>
            </div>
            <div className="card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="recent-appointments">
                  <tr>
                    <td>John Doe</td>
                    <td>Dr. Smith</td>
                    <td>10:00 AM</td>
                    <td><span style={{ color: 'green' }}>Confirmed</span></td>
                  </tr>
                  <tr>
                    <td>Jane Smith</td>
                    <td>Dr. Johnson</td>
                    <td>2:30 PM</td>
                    <td><span style={{ color: 'orange' }}>Pending</span></td>
                  </tr>
                  <tr>
                    <td>Mike Wilson</td>
                    <td>Dr. Brown</td>
                    <td>4:15 PM</td>
                    <td><span style={{ color: 'green' }}>Confirmed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="content-col">
          <div className="card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="card-body quick-actions">
              <button className="action-btn" onClick={() => handleQuickAction('newPatient')}>
                <i className="fas fa-plus"></i>
                <span>New Patient</span>
              </button>
              <button className="action-btn" onClick={() => handleQuickAction('newAppointment')}>
                <i className="fas fa-calendar-plus"></i>
                <span>New Appointment</span>
              </button>
              <button className="action-btn" onClick={() => handleQuickAction('addMedicine')}>
                <i className="fas fa-pills"></i>
                <span>Add Medicine</span>
              </button>
              <button className="action-btn" onClick={() => handleQuickAction('generateBill')}>
                <i className="fas fa-file-invoice"></i>
                <span>Generate Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 
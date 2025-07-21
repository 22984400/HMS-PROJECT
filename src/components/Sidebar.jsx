import React, { useState } from 'react';

function Sidebar({ activeSection, onSectionChange, role = 'admin' }) {
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
          { id: 'patients', icon: 'fas fa-user-injured', label: 'Patients' },
          { id: 'appointments', icon: 'fas fa-calendar-check', label: 'Appointments' },
          { id: 'doctors', icon: 'fas fa-user-md', label: 'Doctors' },
          { id: 'medical-records', icon: 'fas fa-file-medical', label: 'Medical Records' },
          { id: 'data-viewer', icon: 'fas fa-database', label: 'Data Viewer' },
          { id: 'staff', icon: 'fas fa-users', label: 'Staff' },
          { id: 'pharmacy', icon: 'fas fa-pills', label: 'Pharmacy' },
          { id: 'lab', icon: 'fas fa-flask', label: 'Laboratory' },
          { id: 'billing', icon: 'fas fa-file-invoice-dollar', label: 'Billing' },
          { id: 'inventory', icon: 'fas fa-boxes', label: 'Inventory' },
          { id: 'feedback', icon: 'fas fa-comment-alt', label: 'Feedback' }
        ];
      case 'doctor':
        return [
          { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
          { id: 'appointments', icon: 'fas fa-calendar-check', label: 'My Appointments' },
          { id: 'patients', icon: 'fas fa-user-injured', label: 'My Patients' },
          { id: 'consultations', icon: 'fas fa-stethoscope', label: 'Consultations' },
          { id: 'data-viewer', icon: 'fas fa-database', label: 'Data Viewer' },
          { id: 'schedule', icon: 'fas fa-clock', label: 'My Schedule' },
          { id: 'reports', icon: 'fas fa-chart-line', label: 'Reports' }
        ];
      case 'patient':
        return [
          { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
          { id: 'appointments', icon: 'fas fa-calendar-check', label: 'My Appointments' },
          { id: 'medical-records', icon: 'fas fa-file-medical', label: 'Medical Records' },
          { id: 'data-viewer', icon: 'fas fa-database', label: 'Data Viewer' },
          { id: 'prescriptions', icon: 'fas fa-prescription', label: 'Prescriptions' },
          { id: 'billing', icon: 'fas fa-file-invoice-dollar', label: 'My Bills' },
          { id: 'profile', icon: 'fas fa-user', label: 'My Profile' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="sidebar">
      <div className="logo">
        <h2>HMS Pro</h2>
        <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
          {role.charAt(0).toUpperCase() + role.slice(1)} Portal
        </small>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li
            key={item.id}
            className={activeSection === item.id ? 'active' : ''}
            onClick={() => onSectionChange(item.id)}
          >
            <i className={item.icon}></i> {item.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar; 
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import DoctorManagement from './components/DoctorManagement';
import AppointmentManagement from './components/AppointmentManagement';
import MedicalRecordManagement from './components/MedicalRecordManagement';
import DataViewer from './components/DataViewer';
import Login from './components/Login';

function AdminDashboard({ activeSection, onSectionChange }) {
  return (
    <div className="content-area">
      {activeSection === 'dashboard' && <Dashboard onSectionChange={onSectionChange} />}
      {activeSection === 'patients' && <PatientManagement role="admin" />}
      {activeSection === 'doctors' && <DoctorManagement role="admin" />}
      {activeSection === 'appointments' && <AppointmentManagement role="admin" />}
      {activeSection === 'medical-records' && <MedicalRecordManagement role="admin" />}
      {activeSection === 'data-viewer' && <DataViewer role="admin" />}
      {activeSection === 'staff' && <div className="content-section"><h2>Staff Management</h2><p>Staff management features coming soon...</p></div>}
      {activeSection === 'pharmacy' && <div className="content-section"><h2>Pharmacy Management</h2><p>Pharmacy management features coming soon...</p></div>}
      {activeSection === 'lab' && <div className="content-section"><h2>Laboratory Management</h2><p>Laboratory management features coming soon...</p></div>}
      {activeSection === 'billing' && <div className="content-section"><h2>Billing Management</h2><p>Billing management features coming soon...</p></div>}
      {activeSection === 'inventory' && <div className="content-section"><h2>Inventory Management</h2><p>Inventory management features coming soon...</p></div>}
      {activeSection === 'feedback' && <div className="content-section"><h2>Feedback Management</h2><p>Feedback management features coming soon...</p></div>}
    </div>
  );
}

function DoctorDashboard({ user, activeSection }) {
  return (
    <div className="content-area">
      {activeSection === 'dashboard' && <div className="content-section"><h2>Doctor Dashboard</h2><p>Welcome, Dr. {user.name}! Manage your patients and appointments.</p></div>}
      {activeSection === 'appointments' && <AppointmentManagement role="doctor" userId={user._id} />}
      {activeSection === 'patients' && <PatientManagement role="doctor" userId={user._id} />}
      {activeSection === 'schedule' && <div className="content-section"><h2>My Schedule</h2><p>Schedule management features coming soon...</p></div>}
      {activeSection === 'consultations' && <MedicalRecordManagement role="doctor" userId={user._id} />}
      {activeSection === 'reports' && <div className="content-section"><h2>Reports</h2><p>Reporting features coming soon...</p></div>}
      {activeSection === 'data-viewer' && <DataViewer role="doctor" />}
    </div>
  );
}

function PatientDashboard({ user, activeSection }) {
  return (
    <div className="content-area">
      {activeSection === 'dashboard' && <div className="content-section"><h2>Patient Dashboard</h2><p>Welcome, {user.name}! View your appointments and medical records.</p></div>}
      {activeSection === 'appointments' && <AppointmentManagement role="patient" userId={user._id} />}
      {activeSection === 'medical-records' && <MedicalRecordManagement role="patient" userId={user._id} />}
      {activeSection === 'prescriptions' && <div className="content-section"><h2>My Prescriptions</h2><p>Prescription management features coming soon...</p></div>}
      {activeSection === 'billing' && <div className="content-section"><h2>My Bills</h2><p>Billing features coming soon...</p></div>}
      {activeSection === 'profile' && <div className="content-section"><h2>My Profile</h2><p>Profile management features coming soon...</p></div>}
      {activeSection === 'data-viewer' && <DataViewer role="patient" />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogin = (userData) => {
    console.log('handleLogin called with userData:', userData);
    console.log('User role:', userData.role);
    setUser(userData);
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveSection('dashboard');
  };

  // Check if user is already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Found existing user in localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  console.log('Current user state:', user);
  console.log('Current activeSection:', activeSection);

  if (!user) {
    console.log('No user, showing login page');
    return <Login onLogin={handleLogin} />;
  }

  console.log('User logged in, role:', user.role);
  console.log('Rendering dashboard for role:', user.role);

  return (
    <div className="app">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        role={user.role} 
      />
      <div className="main-content">
        <TopNav user={user} onLogout={handleLogout} />
        {user.role === 'admin' && (
          <AdminDashboard 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        )}
        {user.role === 'doctor' && (
          <DoctorDashboard 
            user={user}
            activeSection={activeSection} 
          />
        )}
        {user.role === 'patient' && (
          <PatientDashboard 
            user={user}
            activeSection={activeSection} 
          />
        )}
      </div>
    </div>
  );
}

export default App; 
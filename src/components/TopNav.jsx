import React from 'react';

function TopNav({ user, onLogout }) {
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Patient';
      default: return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return 'fas fa-user-shield';
      case 'doctor': return 'fas fa-user-md';
      case 'patient': return 'fas fa-user-injured';
      default: return 'fas fa-user';
    }
  };

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <h1 className="app-title">HMS Pro</h1>
        <span className="app-subtitle">Hospital Management System</span>
      </div>
      
      <div className="top-nav-right">
        <div className="user-info">
          <div className="user-avatar">
            <i className={getRoleIcon(user.role)}></i>
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{getRoleDisplayName(user.role)}</div>
            <div className="user-id">ID: {user.userId}</div>
          </div>
        </div>
        
        <button className="logout-btn" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default TopNav; 
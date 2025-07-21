import React, { useState } from 'react';
import { authAPI } from '../services/api';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'patient'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login logic
        console.log('Attempting login with:', { email: formData.email, password: formData.password });
        
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });

        console.log('Login response:', response.data);

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('User data stored:', user);
        console.log('User role:', user.role);
        
        onLogin(user);
      } else {
        // Registration logic
        const response = await authAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role
        });

        setSuccess('Account created successfully! Please login with your credentials.');
        setIsLogin(true);
        setFormData({
          email: formData.email, // Keep email for convenience
          password: '',
          name: '',
          phone: '',
          role: 'patient'
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'patient'
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to your account' : 'Join our hospital management system'}</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your phone number"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-control"
              placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
              minLength={isLogin ? undefined : 6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Account Type</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-control"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
              <small className="form-text">
                {formData.role === 'patient' 
                  ? 'Patients can book appointments and view their medical records'
                  : 'Doctors can manage patients and appointments (requires admin approval)'
                }
              </small>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <span>
                <i className="fas fa-spinner fa-spin"></i> 
                {isLogin ? ' Signing In...' : ' Creating Account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="link-btn" 
              onClick={toggleMode}
              disabled={loading}
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="demo-credentials">
            <h4>Demo Credentials</h4>
            <div className="demo-section">
              <h5>Admin Access</h5>
              <p><strong>Email:</strong> admin@gmail.com</p>
              <p><strong>Password:</strong> 000000</p>
            </div>
            <div className="demo-section">
              <h5>Doctor Access</h5>
              <p><strong>Email:</strong> doctor1@hms.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
            <div className="demo-section">
              <h5>Patient Access</h5>
              <p><strong>Email:</strong> patient1@hms.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login; 
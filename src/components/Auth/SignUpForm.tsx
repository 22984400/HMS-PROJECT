// src/components/Auth/SignUpForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SignUpForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    role: 'Patient',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Replace with your API call
      const response = await fakeRegisterApi(formData);
      if (response.success) {
        navigate('/login');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Create Account</h2>
      <p className="mb-4 text-gray-600">Join our hospital management system</p>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="fullName"
          type="text"
          placeholder="Full Name"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="Email Address"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          value={formData.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <div>
          <label className="mr-4">Account Type</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
          </select>
          {formData.role === 'Patient' && (
            <p className="text-sm text-gray-500 mt-1">
              Patients can book appointments and view their medical records
            </p>
          )}
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          CREATE ACCOUNT
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <span onClick={() => navigate('/login')} className="text-blue-600 hover:underline cursor-pointer">
          Sign In
        </span>
      </p>
    </div>
  );
};

// Mock API call
const fakeRegisterApi = async (data: any) => {
  // Simulate success or failure
  return { success: true };
};

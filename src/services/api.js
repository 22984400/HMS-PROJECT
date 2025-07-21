import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auto-refresh data every 30 seconds for real-time updates
const autoRefreshData = () => {
  // This will be called by components that need auto-refresh
  return setInterval(() => {
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('dataRefresh'));
  }, 30000); // 30 seconds
};

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getUsers: () => api.get('/auth/users'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Patients API
export const patientsAPI = {
  getAll: (params = {}) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  getByDoctor: (doctorId) => api.get(`/patients/doctor/${doctorId}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  search: (query) => api.get(`/patients/search?q=${query}`),
};

// Doctors API
export const doctorsAPI = {
  getAll: (params = {}) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
  getAvailable: (date, time) => api.get(`/doctors/available?date=${date}&time=${time}`),
  getSchedule: (id) => api.get(`/doctors/${id}/schedule`),
  updateSchedule: (id, schedule) => api.put(`/doctors/${id}/schedule`, schedule),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params = {}) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  getByPatient: (patientId) => api.get(`/appointments/patient/${patientId}`),
  getByDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  getUpcoming: () => api.get('/appointments/upcoming'),
  getToday: () => api.get('/appointments/today'),
  getByDate: (date) => api.get(`/appointments/date/${date}`),
};

// Medical Records API
export const medicalRecordsAPI = {
  getAll: (params = {}) => api.get('/medical-records', { params }),
  getById: (id) => api.get(`/medical-records/${id}`),
  getByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  getByDoctor: (doctorId) => api.get(`/medical-records/doctor/${doctorId}`),
  create: (data) => api.post('/medical-records', data),
  update: (id, data) => api.put(`/medical-records/${id}`, data),
  delete: (id) => api.delete(`/medical-records/${id}`),
  getLatest: (patientId) => api.get(`/medical-records/patient/${patientId}/latest`),
};

// Utility functions for auto-refresh
export const refreshUtils = {
  startAutoRefresh: autoRefreshData,
  stopAutoRefresh: (intervalId) => clearInterval(intervalId),
  triggerRefresh: () => window.dispatchEvent(new CustomEvent('dataRefresh')),
};

export default api; 
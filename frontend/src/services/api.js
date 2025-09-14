// frontend/src/services/api.js - Updated with compliance endpoints
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Create axios instance with common config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
  databaseStatus: () => api.get('/database/status')
};

// Enhanced compliance API (PostgreSQL)
export const complianceEnhancedAPI = {
  check: (params) => api.post('/compliance-enhanced/check', params),
  getRules: (params) => api.get('/compliance-enhanced/rules', { params }),
  getStatus: () => api.get('/compliance-enhanced/status')
};

// Legacy compliance API (SQLite) - for backward compatibility
export const complianceAPI = {
  getAll: () => api.get('/compliance'),
  getByProject: (projectId) => api.get(`/compliance/project/${projectId}`),
  getDemo: () => api.get('/compliance/demo'),
  create: (complianceData) => api.post('/compliance', complianceData),
  update: (id, complianceData) => api.put(`/compliance/${id}`, complianceData),
  delete: (id) => api.delete(`/compliance/${id}`),
};

// Projects API (existing)
export const projectsAPI = {
  getAll: (status = 'active') => api.get(`/projects?status=${status}`),
  getByStatus: (status) => api.get(`/projects/by-status/${status}`),
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post('/projects', projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  archive: (id) => api.put(`/projects/${id}/archive`),
  restore: (id) => api.put(`/projects/${id}/restore`),
  bulkArchive: (projectIds) => api.put('/projects/bulk-archive', { projectIds }),
  deletePermanent: (id) => api.delete(`/projects/${id}/permanent`),
  bulkDeletePermanent: (projectIds) => api.delete('/projects/bulk-permanent', { data: { projectIds } }),
};

// Materials API (existing)
export const materialsAPI = {
  getAll: () => api.get('/materials'),
  getByProject: (projectId) => api.get(`/materials/project/${projectId}`),
  create: (materialData) => api.post('/materials', materialData),
  update: (id, materialData) => api.put(`/materials/${id}`, materialData),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Ecological API (existing)
export const ecologicalAPI = {
  getAll: () => api.get('/ecological'),
  getByProject: (projectId) => api.get(`/ecological/project/${projectId}`),
  create: (ecologicalData) => api.post('/ecological', ecologicalData),
  update: (id, ecologicalData) => api.put(`/ecological/${id}`, ecologicalData),
  delete: (id) => api.delete(`/ecological/${id}`),
};

export default api;
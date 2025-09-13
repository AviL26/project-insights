// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post('/projects', projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`)
};

// Materials API
export const materialsAPI = {
  getByProject: (projectId) => api.get(`/materials/project/${projectId}`),
  getDemo: () => api.get('/materials/demo'),
};

// Compliance API
export const complianceAPI = {
  getByProject: (projectId) => api.get(`/compliance/project/${projectId}`),
  getDemo: () => api.get('/compliance/demo'),
};

// Ecological API
export const ecologicalAPI = {
  getByProject: (projectId) => api.get(`/ecological/project/${projectId}`),
  getDemo: () => api.get('/ecological/demo'),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
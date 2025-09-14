// frontend/src/services/api.js - Updated with Archive System
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Create axios instance with common config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API with archive functionality
export const projectsAPI = {
  // Get projects by status (active or archived)
  getAll: (status = 'active') => api.get(`/projects?status=${status}`),
  
  // Get projects by specific status with detailed response
  getByStatus: (status) => api.get(`/projects/by-status/${status}`),
  
  // Get single project
  getById: (id) => api.get(`/projects/${id}`),
  
  // Create new project (always active)
  create: (projectData) => api.post('/projects', projectData),
  
  // Update project
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  
  // Archive single project
  archive: (id) => api.put(`/projects/${id}/archive`),
  
  // Restore project from archive
  restore: (id) => api.put(`/projects/${id}/restore`),
  
  // Bulk archive projects
  bulkArchive: (projectIds) => api.put('/projects/bulk-archive', { projectIds }),
  
  // Permanently delete single project (HARD DELETE)
  deletePermanent: (id) => api.delete(`/projects/${id}/permanent`),
  
  // Bulk permanent delete (HARD DELETE)
  bulkDeletePermanent: (projectIds) => api.delete('/projects/bulk-permanent', { data: { projectIds } }),

  // Legacy methods for backward compatibility
  delete: (id) => projectsAPI.archive(id), // Map old delete to archive
  bulkDelete: (projectIds) => projectsAPI.bulkArchive(projectIds), // Map old bulk delete to bulk archive
};

// Materials API (unchanged)
export const materialsAPI = {
  getAll: () => api.get('/materials'),
  getByProject: (projectId) => api.get(`/materials/project/${projectId}`),
  create: (materialData) => api.post('/materials', materialData),
  update: (id, materialData) => api.put(`/materials/${id}`, materialData),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Compliance API (unchanged)
export const complianceAPI = {
  getAll: () => api.get('/compliance'),
  getByProject: (projectId) => api.get(`/compliance/project/${projectId}`),
  getDemo: () => api.get('/compliance/demo'),
  create: (complianceData) => api.post('/compliance', complianceData),
  update: (id, complianceData) => api.put(`/compliance/${id}`, complianceData),
  delete: (id) => api.delete(`/compliance/${id}`),
};

// Ecological API (unchanged)
export const ecologicalAPI = {
  getAll: () => api.get('/ecological'),
  getByProject: (projectId) => api.get(`/ecological/project/${projectId}`),
  create: (ecologicalData) => api.post('/ecological', ecologicalData),
  update: (id, ecologicalData) => api.put(`/ecological/${id}`, ecologicalData),
  delete: (id) => api.delete(`/ecological/${id}`),
};

export default api;
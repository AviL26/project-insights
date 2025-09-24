// frontend/src/services/api.js - COMPLETE FILE WITH PORT 3001 FIX
import axios from 'axios';

// FIXED: Use port 3001 to match your backend
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

// Create axios instance with common config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout for project creation
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data) {
      console.log('📤 Request Data:', config.data);
    }
  }
  return config;
});

// Response interceptor for error handling and debugging
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    // Enhanced error messages for common issues
    if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      error.message = 'Cannot connect to server. Make sure backend is running on port 3001.';
    } else if (error.response?.status === 400) {
      error.message = error.response.data?.error || error.response.data?.message || 'Bad Request - Check data format';
    } else if (error.response?.status === 404) {
      error.message = 'API endpoint not found. Check if backend routes are configured correctly.';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Check backend logs for details.';
    }
    
    return Promise.reject(error);
  }
);

// Health check API
export const healthAPI = {
  check: () => api.get('/health'),
  databaseStatus: () => api.get('/database/status')
};

// Projects API - Enhanced with better error handling
export const projectsAPI = {
  // Get projects by status
  getByStatus: (status = 'active') => {
    console.log(`Fetching ${status} projects...`);
    return api.get(`/projects/by-status/${status}`);
  },
  
  // Get all projects (legacy support)
  getAll: (status = 'active') => api.get(`/projects?status=${status}`),
  
  // Get single project
  getById: (id) => api.get(`/projects/${id}`),
  
  // Create new project - ENHANCED for debugging
  create: (projectData) => {
    console.log('🚀 Creating project with data:', projectData);
    
    // Debug: Show data types
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Data types check:', {
        lat: typeof projectData.lat,
        lon: typeof projectData.lon,
        length: typeof projectData.length,
        width: typeof projectData.width,
        height: typeof projectData.height,
        water_depth: typeof projectData.water_depth,
        design_life: typeof projectData.design_life
      });
    }
    
    return api.post('/projects', projectData);
  },
  
  // Update project
  update: (id, projectData) => {
    console.log(`Updating project ${id}:`, projectData);
    return api.put(`/projects/${id}`, projectData);
  },
  
  // Archive operations
  archive: (id) => api.put(`/projects/${id}/archive`),
  restore: (id) => api.put(`/projects/${id}/restore`),
  bulkArchive: (projectIds) => api.put('/projects/bulk-archive', { projectIds }),
  
  // Delete operations
  deletePermanent: (id) => api.delete(`/projects/${id}/permanent`),
  bulkDeletePermanent: (projectIds) => api.delete('/projects/bulk-permanent', { 
    data: { projectIds } 
  }),
};

// Enhanced Compliance API (PostgreSQL backend)
export const complianceEnhancedAPI = {
  check: (params) => {
    console.log('🔍 Checking compliance with params:', params);
    return api.post('/compliance-enhanced/check', params);
  },
  getRules: (params) => api.get('/compliance-enhanced/rules', { params }),
  getStatus: () => api.get('/compliance-enhanced/status')
};

// Legacy Compliance API (SQLite) - for backward compatibility
export const complianceAPI = {
  getAll: () => api.get('/compliance'),
  getByProject: (projectId) => api.get(`/compliance/project/${projectId}`),
  getDemo: () => api.get('/compliance/demo'),
  create: (complianceData) => api.post('/compliance', complianceData),
  update: (id, complianceData) => api.put(`/compliance/${id}`, complianceData),
  delete: (id) => api.delete(`/compliance/${id}`),
};

// Materials API
export const materialsAPI = {
  getAll: () => api.get('/materials'),
  getByProject: (projectId) => api.get(`/materials/project/${projectId}`),
  create: (materialData) => api.post('/materials', materialData),
  update: (id, materialData) => api.put(`/materials/${id}`, materialData),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Ecological API
export const ecologicalAPI = {
  getAll: () => api.get('/ecological'),
  getByProject: (projectId) => api.get(`/ecological/project/${projectId}`),
  create: (ecologicalData) => api.post('/ecological', ecologicalData),
  update: (id, ecologicalData) => api.put(`/ecological/${id}`, ecologicalData),
  delete: (id) => api.delete(`/ecological/${id}`),
};

// Lookup Tables API - For project wizard dropdowns
export const lookupAPI = {
  // Countries and regions
  getCountries: () => api.get('/lookup/countries'),
  getRegions: (countryCode) => api.get(`/lookup/regions/${countryCode}`),
  getMarineZones: (countryCode, regionId) => api.get(`/lookup/marine-zones/${countryCode}/${regionId}`),
  
  // Project configuration options
  getStructureTypes: () => api.get('/lookup/structure-types'),
  getWaveExposure: () => api.get('/lookup/wave-exposure'),
  getSeabedTypes: () => api.get('/lookup/seabed-types'),
  getPrimaryGoals: () => api.get('/lookup/primary-goals'),
  
  // Get all lookup data at once
  getAll: () => api.get('/lookup/all')
};

// Export the main axios instance and API base for other modules
export { API_BASE };
export default api;
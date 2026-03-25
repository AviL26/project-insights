import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const projectsApi = {
  list: (params) => api.get('/projects', { params }).then(r => r.data),
  get: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  archive: (id) => api.put(`/projects/${id}/archive`).then(r => r.data),
  restore: (id) => api.put(`/projects/${id}/restore`).then(r => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then(r => r.data),
};

export const wizardApi = {
  bootstrap: () => api.get('/wizard/bootstrap').then(r => r.data),
  complete: (data) => api.post('/wizard/complete', data).then(r => r.data),
};

export const materialsApi = {
  list: (params) => api.get('/materials', { params }).then(r => r.data),
  get: (id) => api.get(`/materials/${id}`).then(r => r.data),
  categories: () => api.get('/materials/categories').then(r => r.data),
};

export const complianceApi = {
  stats: () => api.get('/compliance/stats').then(r => r.data),
  checks: (params) => api.get('/compliance/checks', { params }).then(r => r.data),
  deadlines: (params) => api.get('/compliance/deadlines', { params }).then(r => r.data),
  requirements: (params) => api.get('/compliance/requirements', { params }).then(r => r.data),
};

export const speciesApi = {
  search: (params) => api.get('/species/search', { params }).then(r => r.data),
  occurrences: (params) => api.get('/species/occurrences', { params }).then(r => r.data),
};

export const climateApi = {
  marine: (params) => api.get('/climate/marine', { params }).then(r => r.data),
  weather: (params) => api.get('/climate/weather', { params }).then(r => r.data),
};

export default api;

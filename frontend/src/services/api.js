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

export const materialsApi = {
  catalog: () => api.get('/materials/catalog').then(r => r.data),
  listForProject: (projectId) => api.get(`/materials/project/${projectId}`).then(r => r.data),
  add: (projectId, data) => api.post(`/materials/project/${projectId}`, data).then(r => r.data),
  update: (id, data) => api.put(`/materials/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/materials/${id}`).then(r => r.data),
};

export const complianceApi = {
  listForProject: (projectId) => api.get(`/compliance/project/${projectId}`).then(r => r.data),
  generate: (projectId) => api.post('/compliance/generate', { project_id: projectId }).then(r => r.data),
  updateStatus: (id, data) => api.put(`/compliance/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/compliance/${id}`).then(r => r.data),
  resetProject: (projectId) => api.delete(`/compliance/project/${projectId}`).then(r => r.data),
};

export const ecologicalApi = {
  metrics: () => api.get('/ecological/metrics').then(r => r.data),
  dashboard: (projectId) => api.get(`/ecological/project/${projectId}/dashboard`).then(r => r.data),
  surveys: (projectId) => api.get(`/ecological/project/${projectId}`).then(r => r.data),
  createSurvey: (data) => api.post('/ecological/survey', data).then(r => r.data),
  deleteSurvey: (id) => api.delete(`/ecological/survey/${id}`).then(r => r.data),
};

export const wizardApi = {
  bootstrap: () => api.get('/wizard/bootstrap').then(r => r.data),
  complete: (data) => api.post('/wizard/complete', data).then(r => r.data),
};

export default api;

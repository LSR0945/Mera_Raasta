import api from './axios';

export const roadmapAPI = {
  get: () => api.get('/roadmap'),
  create: (data) => api.post('/roadmap', data),
  generate: (data) => api.post('/roadmap/generate', data),
  update: (data) => api.put('/roadmap', data),
  updateNode: (nodeId, data) => api.put(`/roadmap/node/${nodeId}`, data),
  delete: () => api.delete('/roadmap'),
};

export const nbaAPI = {
  get: () => api.get('/next-best-action'),
  refresh: () => api.post('/next-best-action/refresh'),
  dismiss: (actionIndex) => api.put(`/next-best-action/dismiss/${actionIndex}`),
};
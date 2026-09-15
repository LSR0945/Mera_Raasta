import api from './axios';

export const parentAPI = {
  getStats: () => api.get('/parent/stats'),
  getChildren: () => api.get('/parent/children'),
  addChild: (data) => api.post('/parent/children', data),
  getChild: (childId) => api.get(`/parent/children/${childId}`),
  getChildRoadmap: (childId) => api.get(`/parent/children/${childId}/roadmap`),
  getChildProfile: (childId) => api.get(`/parent/children/${childId}/profile`),
};

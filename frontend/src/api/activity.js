import api from './axios';

export const activityAPI = {
  getMyActivities: (params) => api.get('/activities/me', { params }),
  getChildActivities: (childId, params) => api.get(`/activities/child/${childId}`, { params }),
  getChildStats: (childId) => api.get(`/activities/child/${childId}/stats`),
};

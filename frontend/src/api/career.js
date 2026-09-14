import api from './axios';

export const careerAPI = {
  getAll: (params) => api.get('/careers', { params }),
  getBySlug: (slug) => api.get(`/careers/${slug}`),
  getById: (id) => api.get(`/careers/detail/${id}`),
  compare: (ids) => api.get('/careers/compare', { params: { ids } }),
  getRecommendations: () => api.get('/careers/recommendations'),
  refreshRecommendations: () => api.post('/careers/recommendations/refresh'),
};

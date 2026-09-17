import api from './axios';

// ═══ College API — Colleges se related saare API calls ═══

export const collegeAPI = {
  // City ke colleges lao — GET /colleges?city=Delhi&type=government
  getByCity: (params) => api.get('/colleges', { params }),

  // College detail — GET /colleges/iit-delhi
  getBySlug: (slug) => api.get(`/colleges/${slug}`),

  // Colleges search karo — GET /colleges/search?q=IIT
  search: (q) => api.get('/colleges/search', { params: { q } }),

  // Saari cities — GET /colleges/cities
  getCities: () => api.get('/colleges/cities'),

  // Nearby colleges — POST /colleges/nearby { city, state, budget, stream }
  getNearby: (data) => api.post('/colleges/nearby', data),
};
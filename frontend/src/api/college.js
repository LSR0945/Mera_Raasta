import api from './axios';

// ═══ College API — Nearby colleges ke saare API calls ═══
// NOTE: /colleges path education page bhi use karta hai (education data).
// Isliye nearby colleges alag namespace /nearby-colleges par jate hain.

export const collegeAPI = {
  // City ke colleges lao — GET /nearby-colleges?city=Delhi&type=government
  getByCity: (params) => api.get('/nearby-colleges', { params }),

  // College detail — GET /nearby-colleges/iit-delhi
  getBySlug: (slug) => api.get(`/nearby-colleges/${slug}`),

  // Colleges search karo — GET /nearby-colleges/search?q=IIT
  search: (q) => api.get('/nearby-colleges/search', { params: { q } }),

  // Saari cities — GET /nearby-colleges/cities
  getCities: () => api.get('/nearby-colleges/cities'),

  // Nearby colleges — POST /nearby-colleges/nearby { city, state, budget, stream }
  getNearby: (data) => api.post('/nearby-colleges/nearby', data),
};

import api from './axios';

export const locationAPI = {
  getStates: () => api.get('/locations/states'),
  getDistricts: (stateCode) => api.get(`/locations/states/${stateCode}/districts`),
  getCities: (stateCode, district) => api.get(`/locations/states/${stateCode}/districts/${district}/cities`),
  search: (q) => api.get('/locations/search', { params: { q } }),
};
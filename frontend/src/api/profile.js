import api from './axios';

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  completeOnboarding: (data) => api.post('/profile/complete-onboarding', data),
};

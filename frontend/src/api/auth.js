import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (email, otp) => api.post('/auth/verify-email', { email, otp }),
  checkVerificationStatus: (email) => api.get('/auth/verification-status', { params: { email } }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

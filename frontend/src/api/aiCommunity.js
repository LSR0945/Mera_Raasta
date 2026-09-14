import api from './axios';

export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
};

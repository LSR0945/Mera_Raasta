import api from './axios';

export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  chatStream: async function*(data) {
    const response = await fetch('/api/v1/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            yield parsed;
          } catch (e) { /* skip invalid JSON */ }
        }
      }
    }
  },
  clearHistory: () => api.delete('/ai/chat/history'),
  getHistory: () => api.get('/ai/chat/history'),

  // ChatGPT jaisa multi-chat
  listSessions: () => api.get('/ai/chat/sessions'),
  createSession: () => api.post('/ai/chat/sessions'),
  getSession: (id) => api.get(`/ai/chat/sessions/${id}`),
  deleteSession: (id) => api.delete(`/ai/chat/sessions/${id}`),
};

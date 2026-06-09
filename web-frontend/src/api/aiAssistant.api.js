import { api } from './client';

export const aiAssistantApi = {
  chat: (message, history = []) => api.post('/ai/assistant/chat', { message, history }),
};

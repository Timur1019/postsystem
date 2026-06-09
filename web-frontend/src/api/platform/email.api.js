import { api } from '../client';

export const platformEmailApi = {
  templates: () => api.get('/platform/email/templates'),
  preview: (body) => api.post('/platform/email/templates/preview', body),
  broadcast: (body) => api.post('/platform/email/broadcast', body),
};

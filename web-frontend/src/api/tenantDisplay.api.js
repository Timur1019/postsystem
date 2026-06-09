import { api } from './client';

export const tenantDisplayApi = {
  get: () => api.get('/tenant-display-settings'),
  save: (data) => api.put('/tenant-display-settings', data),
};

import { api } from './client';

export const customerApi = {
  getAll: (params) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
};

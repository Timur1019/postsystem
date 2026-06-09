import { api } from './client';

export const categoryApi = {
  getAll: (config) => api.get('/categories', config),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

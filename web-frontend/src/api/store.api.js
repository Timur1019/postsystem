import { api } from './client';

export const storeApi = {
  getAll: () => api.get('/stores'),
  getManaged: (params) => api.get('/stores/manage', { params }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  toggle: (id) => api.patch(`/stores/${id}/toggle-active`),
  delete: (id) => api.delete(`/stores/${id}`),
};

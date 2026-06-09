import { api } from './client';

export const returnApi = {
  getAll: (params) => api.get('/returns', { params }),
  getById: (id) => api.get(`/returns/${id}`),
  updateReason: (id, data) => api.patch(`/returns/${id}`, data),
  delete: (id) => api.delete(`/returns/${id}`),
  exportExcel: (params) => api.get('/returns/export', { params, responseType: 'blob' }),
};

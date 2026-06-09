import { api } from './client';

export const companyApi = {
  getAll: (params) => api.get('/companies', { params }),
  listAll: () => api.get('/companies/all'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

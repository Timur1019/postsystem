import { api } from './client';

export const cashRegisterConfigApi = {
  getAll: (params) => api.get('/cash-register-configs', { params }),
  getFormOptions: () => api.get('/cash-register-configs/form-options'),
  create: (body) => api.post('/cash-register-configs', body),
  update: (id, body) => api.put(`/cash-register-configs/${id}`, body),
  delete: (id) => api.delete(`/cash-register-configs/${id}`),
};

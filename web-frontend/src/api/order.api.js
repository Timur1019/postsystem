import { api } from './client';

export const orderApi = {
  getAll: (params) => api.get('/orders', { params }),
  getCouriers: () => api.get('/orders/couriers'),
  create: (body) => api.post('/orders', body),
};

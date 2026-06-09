import { api } from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  cashierPinLogin: (data) => api.post('/auth/cashier-pin/login', data),
  register: (data) => api.post('/auth/register', data),
  refresh: () => api.post('/auth/refresh'),
  verifyPassword: (data) => api.post('/auth/verify-password', data),
  verifyPin: (data) => api.post('/auth/verify-pin', data),
};

import { api } from '../client';

export const platformSecurityApi = {
  getCashierServerPassword: () => api.get('/platform/security/cashier-server-password'),
  updateCashierServerPassword: (password) =>
    api.put('/platform/security/cashier-server-password', { password }),
  listSuperAdmins: () => api.get('/platform/security/super-admins'),
  createSuperAdmin: (body) => api.post('/platform/security/super-admins', body),
  updateSuperAdmin: (id, body) => api.put(`/platform/security/super-admins/${id}`, body),
};

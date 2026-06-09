import { api } from './client';

export const saleApi = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  exportLines: (params) => api.get('/sales/export', { params, responseType: 'blob' }),
  getById: (id) => api.get(`/sales/${id}`),
  getReceipt: (num) =>
    api.get(`/sales/receipt/${encodeURIComponent(String(num).trim())}`),
  voidSale: (id, reason) =>
    api.post(`/sales/${id}/void`, null, { params: { reason } }),
  returnItems: (id, body) => api.post(`/sales/${id}/return-items`, body),
  mySales: (params) => api.get('/sales/my-sales', { params }),
};

import { api } from './client';

export const warehouseApi = {
  getProducts: (params) => api.get('/warehouse/products', { params }),
  receipt: (data) => api.post('/warehouse/receipt', data),
  createReceipt: (data) => api.post('/warehouse/receipts', data),
  getReceipt: (id) => api.get(`/warehouse/receipts/${id}`),
  createInventory: (data) => api.post('/warehouse/inventories', data),
  getInventory: (id) => api.get(`/warehouse/inventories/${id}`),
  createTransfer: (data) => api.post('/warehouse/transfers', data),
  getTransfer: (id) => api.get(`/warehouse/transfers/${id}`),
};

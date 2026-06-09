import { api } from './client';

export const syncApi = {
  bootstrap: (storeId) => api.get('/sync/bootstrap', { params: { storeId } }),
  pushSalesBatch: (body) => api.post('/sync/sales/batch', body),
};

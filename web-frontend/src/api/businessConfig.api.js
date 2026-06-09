import { api } from './client';

export const businessConfigApi = {
  byCode: (code) => api.get('/business-config', { params: { code } }),
  forStore: (storeId) => api.get(`/business-config/store/${storeId}`),
};

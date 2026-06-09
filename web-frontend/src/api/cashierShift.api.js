import { api } from './client';

export const cashierShiftApi = {
  current: (storeId) => api.get('/cashier/shifts/current', { params: { storeId } }),
  open: (storeId) => api.post('/cashier/shifts/open', null, { params: { storeId } }),
  xReport: (id) => api.get(`/cashier/shifts/${id}/x-report`),
  zReportPreview: (id) => api.get(`/cashier/shifts/${id}/z-report`),
  finalizeZReport: (id) => api.post(`/cashier/shifts/${id}/z-report`),
  close: (id) => api.post(`/cashier/shifts/${id}/close`),
};

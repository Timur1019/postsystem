import { api } from './client';

export const zReportApi = {
  getAll: (params) => api.get('/z-reports', { params }),
  getById: (id) => api.get(`/z-reports/${id}`),
  exportAll: (params) => api.get('/z-reports/export', { params, responseType: 'blob' }),
  exportSales: (id) => api.get(`/z-reports/${id}/export-sales`, { responseType: 'blob' }),
};

import { api } from './client';

export const reportApi = {
  daily: (params) => api.get('/reports/daily', { params }),
  sales: (from, to) => api.get('/reports/sales', { params: { from, to } }),
  topProducts: (limit, from, to) =>
    api.get('/reports/top-products', { params: { limit, from, to } }),
  cashierPerf: (from, to) => api.get('/reports/cashier-performance', { params: { from, to } }),
  salesByProducts: (params) => api.get('/reports/sales/by-products', { params }),
  salesByCategories: (params) => api.get('/reports/sales/by-categories', { params }),
  salesByStores: (params) => api.get('/reports/sales/by-stores', { params }),
  periodCompare: (params) => api.get('/reports/sales/period-compare', { params }),
  exportSalesByProducts: (params) =>
    api.get('/reports/sales/by-products/export', { params, responseType: 'blob' }),
  exportSalesByCategories: (params) =>
    api.get('/reports/sales/by-categories/export', { params, responseType: 'blob' }),
  exportSalesByStores: (params) =>
    api.get('/reports/sales/by-stores/export', { params, responseType: 'blob' }),
  exportPeriodCompare: (params) =>
    api.get('/reports/sales/period-compare/export', { params, responseType: 'blob' }),
  exportDaily: (params) => api.get('/reports/daily/export', { params, responseType: 'blob' }),
  exportCashierPerf: (from, to) =>
    api.get('/reports/cashier-performance/export', { params: { from, to }, responseType: 'blob' }),
};

import { api } from './client';

export const stockReportApi = {
  dashboard: (params) => api.get('/reports/stock/dashboard', { params }),
  lowStock: (params) => api.get('/reports/stock/low-stock', { params }),
  writeOffs: (params) => api.get('/reports/stock/write-offs', { params }),
  createWriteOff: (body) => api.post('/reports/stock/write-offs', body),
  turnover: (params) => api.get('/reports/stock/turnover', { params }),
  movements: (params) => api.get('/reports/stock/movements', { params }),
  adjustments: (params) => api.get('/reports/stock/adjustments', { params }),
  receipts: (params) => api.get('/reports/stock/receipts', { params }),
  balances: (params) => api.get('/reports/stock/balances', { params }),
  deadStock: (params) => api.get('/reports/stock/dead-stock', { params }),
  inventories: (params) => api.get('/reports/stock/inventories', { params }),
  transfers: (params) => api.get('/reports/stock/transfers', { params }),
  exportBalances: (params) =>
    api.get('/reports/stock/balances/export', { params, responseType: 'blob' }),
  exportDeadStock: (params) =>
    api.get('/reports/stock/dead-stock/export', { params, responseType: 'blob' }),
  exportAdjustments: (params) =>
    api.get('/reports/stock/adjustments/export', { params, responseType: 'blob' }),
  exportInventories: (params) =>
    api.get('/reports/stock/inventories/export', { params, responseType: 'blob' }),
  exportTransfers: (params) =>
    api.get('/reports/stock/transfers/export', { params, responseType: 'blob' }),
};

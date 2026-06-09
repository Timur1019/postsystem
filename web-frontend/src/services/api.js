// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { logoutAndResetSession } from '../utils/authSession';
import { isAuthPage, normalizeCompanyLoginCode, redirectToLogin } from '../utils/authLogin';
import { isApiNetworkError } from '../utils/apiNetworkError';
import { markApiOffline, refreshConnectivityStatus } from '../store/connectivityStore';
import { isDesktopOfflineBridge } from './offline/desktopOfflineBridge';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request interceptor: attach token ----
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // FormData: browser must set multipart boundary (default application/json breaks upload)
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: handle 401 / 403 (stale token, deleted user) ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    // 403 = нет прав на конкретный ресурс, не инвалидируем всю сессию (кассир не должен вылетать).
    if (status === 403) {
      return Promise.reject(error);
    }
    if (status === 401 && !original._retry) {
      original._retry = true;
      const { token, setToken } = useAuthStore.getState();
      const jwtParts = typeof token === 'string' ? token.split('.').length : 0;
      if (!token || jwtParts !== 3) {
        logoutAndResetSession();
        if (!isAuthPage(window.location.pathname)) {
          redirectToLogin();
        }
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: api.defaults.timeout ?? 15_000,
        });
        const { token: newToken, ...profile } = res.data;
        const prevUser = useAuthStore.getState().user;
        const companyLoginCode =
          normalizeCompanyLoginCode(profile.companyLoginCode)
          || normalizeCompanyLoginCode(prevUser?.companyLoginCode);
        useAuthStore.getState().setAuth(newToken, {
          ...profile,
          ...(companyLoginCode ? { companyLoginCode } : {}),
        });
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        if (isApiNetworkError(refreshErr)) {
          return Promise.reject(error);
        }
        logoutAndResetSession();
        if (!isAuthPage(window.location.pathname)) {
          redirectToLogin();
        }
      }
    }
    if (isApiNetworkError(error) && isDesktopOfflineBridge()) {
      markApiOffline();
      refreshConnectivityStatus();
    }
    return Promise.reject(error);
  }
);

export const syncApi = {
  bootstrap: (storeId) => api.get('/sync/bootstrap', { params: { storeId } }),
  pushSalesBatch: (body) => api.post('/sync/sales/batch', body),
};

// ---- Typed API modules ----
export const authApi = {
  login:   (data) => api.post('/auth/login', data),
  cashierPinLogin: (data) => api.post('/auth/cashier-pin/login', data),
  register:(data) => api.post('/auth/register', data),
  refresh: () => api.post('/auth/refresh'),
  verifyPassword: (data) => api.post('/auth/verify-password', data),
  verifyPin: (data) => api.post('/auth/verify-pin', data),
};

export const tasnifApi = {
  search: (params) => api.get('/tasnif/mxik/search', { params }),
  detail: (params) => api.get('/tasnif/mxik/detail', { params }),
  lookup: (params) => api.get('/tasnif/mxik/lookup', { params }),
};

export const productApi = {
  getAll:     (params) => api.get('/products', { params }),
  getById:    (id, params) => api.get(`/products/${id}`, { params }),
  lifecycle: (id, params) => api.get(`/products/${id}/lifecycle`, { params }),
  getByBarcode: (barcode, storeId) =>
    api.get(`/products/barcode/${encodeURIComponent(barcode)}`, {
      params: storeId != null ? { storeId } : undefined,
    }),
  create:     (data)   => api.post('/products', data),
  update:     (id, d)  => api.put(`/products/${id}`, d),
  adjustStock:(id, q, type, notes, storeId) =>
    api.patch(`/products/${id}/stock`, null, {
      params: {
        quantity: q,
        movementType: type,
        notes,
        ...(storeId != null ? { storeId } : {}),
      },
    }),
  deactivate: (id)     => api.delete(`/products/${id}`),
  getLowStock:()       => api.get('/products/low-stock'),
  bulkTaxRate:(body)   => api.patch('/products/bulk/tax-rate', body),
  bulkDeactivate: (body) => api.patch('/products/bulk/deactivate', body),
  importTemplate: () =>
    api.get('/products/import/template', { responseType: 'blob' }),
  importPreview: (formData, source = 'CATALOG', options = {}) =>
    api.post('/products/import/preview', formData, {
      params: {
        source,
        ...(options.defaultStorageLocation
          ? { defaultStorageLocation: options.defaultStorageLocation }
          : {}),
      },
      headers: { 'Content-Type': undefined },
    }),
  importUpload: (formData, options) => {
    if (options) {
      formData.append(
        'options',
        new Blob([JSON.stringify(options)], { type: 'application/json' })
      );
    }
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': undefined },
    });
  },
  exportPreview: (params) => api.get('/products/export/preview', { params }),
  exportList: (body) =>
    api.post('/products/export', body ?? {}, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
    }),
};

export const storeApi = {
  getAll: () => api.get('/stores'),
  getManaged: (params) => api.get('/stores/manage', { params }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  toggle: (id) => api.patch(`/stores/${id}/toggle-active`),
  delete: (id) => api.delete(`/stores/${id}`),
};

export const companyApi = {
  getAll: (params) => api.get('/companies', { params }),
  listAll: () => api.get('/companies/all'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

export const platformModuleAccessApi = {
  catalog: () => api.get('/platform/module-access/catalog'),
  listUsers: (companyId) => api.get('/platform/module-access/users', { params: { companyId } }),
  getUser: (userId) => api.get(`/platform/module-access/users/${userId}`),
  updateUser: (userId, body) => api.put(`/platform/module-access/users/${userId}`, body),
  resetUser: (userId) => api.delete(`/platform/module-access/users/${userId}`),
};

export const platformEmailApi = {
  templates: () => api.get('/platform/email/templates'),
  preview: (body) => api.post('/platform/email/templates/preview', body),
  broadcast: (body) => api.post('/platform/email/broadcast', body),
};

export const platformSecurityApi = {
  getCashierServerPassword: () => api.get('/platform/security/cashier-server-password'),
  updateCashierServerPassword: (password) =>
    api.put('/platform/security/cashier-server-password', { password }),
  listSuperAdmins: () => api.get('/platform/security/super-admins'),
  createSuperAdmin: (body) => api.post('/platform/security/super-admins', body),
  updateSuperAdmin: (id, body) => api.put(`/platform/security/super-admins/${id}`, body),
};

export const platformMonitoringApi = {
  overview: () => api.get('/platform/monitoring/overview'),
  metrics: (search) => api.get('/platform/monitoring/metrics', { params: { search } }),
  metricDetail: (name) =>
    api.get(`/platform/monitoring/metrics/${encodeURIComponent(name)}`),
  logs: (params) => api.get('/platform/monitoring/logs', { params }),
  clearLogs: () => api.delete('/platform/monitoring/logs'),
};

export const platformBusinessTypeApi = {
  list: () => api.get('/platform/business-types'),
  get: (id) => api.get(`/platform/business-types/${id}`),
  create: (body) => api.post('/platform/business-types', body),
  update: (id, body) => api.put(`/platform/business-types/${id}`, body),
  delete: (id) => api.delete(`/platform/business-types/${id}`),
  addField: (typeId, body) => api.post(`/platform/business-types/${typeId}/fields`, body),
  updateField: (typeId, fieldId, body) =>
    api.put(`/platform/business-types/${typeId}/fields/${fieldId}`, body),
  deleteField: (typeId, fieldId) => api.delete(`/platform/business-types/${typeId}/fields/${fieldId}`),
};

export const businessConfigApi = {
  byCode: (code) => api.get('/business-config', { params: { code } }),
  forStore: (storeId) => api.get(`/business-config/store/${storeId}`),
};

export const cashRegisterApi = {
  getAll: (params) => api.get('/cash-registers', { params }),
  getTransfers: (params) => api.get('/cash-registers/transfers', { params }),
  exportTransfers: (params) =>
    api.get('/cash-registers/transfers/export', { params, responseType: 'blob' }),
  getEquipmentSerials: () => api.get('/cash-registers/equipment-serials'),
  getById: (id) => api.get(`/cash-registers/${id}`),
  toggleStatus: (id) => api.patch(`/cash-registers/${id}/toggle-status`),
};

export const cashRegisterConfigApi = {
  getAll: (params) => api.get('/cash-register-configs', { params }),
  getFormOptions: () => api.get('/cash-register-configs/form-options'),
  create: (body) => api.post('/cash-register-configs', body),
  update: (id, body) => api.put(`/cash-register-configs/${id}`, body),
  delete: (id) => api.delete(`/cash-register-configs/${id}`),
};

export const zReportApi = {
  getAll: (params) => api.get('/z-reports', { params }),
  getById: (id) => api.get(`/z-reports/${id}`),
  exportAll: (params) => api.get('/z-reports/export', { params, responseType: 'blob' }),
  exportSales: (id) => api.get(`/z-reports/${id}/export-sales`, { responseType: 'blob' }),
};

export const orderApi = {
  getAll: (params) => api.get('/orders', { params }),
  getCouriers: () => api.get('/orders/couriers'),
  create: (body) => api.post('/orders', body),
};

export const saleApi = {
  create:     (data)   => api.post('/sales', data),
  getAll:     (params) => api.get('/sales', { params }),
  exportLines:(params) => api.get('/sales/export', { params, responseType: 'blob' }),
  getById:    (id)     => api.get(`/sales/${id}`),
  getReceipt: (num) =>
    api.get(`/sales/receipt/${encodeURIComponent(String(num).trim())}`),
  voidSale:   (id, reason) =>
    api.post(`/sales/${id}/void`, null, { params: { reason } }),
  returnItems: (id, body) => api.post(`/sales/${id}/return-items`, body),
  mySales:    (params) => api.get('/sales/my-sales', { params }),
};

export const cashierShiftApi = {
  current: (storeId) => api.get('/cashier/shifts/current', { params: { storeId } }),
  open: (storeId) => api.post('/cashier/shifts/open', null, { params: { storeId } }),
  xReport: (id) => api.get(`/cashier/shifts/${id}/x-report`),
  zReportPreview: (id) => api.get(`/cashier/shifts/${id}/z-report`),
  finalizeZReport: (id) => api.post(`/cashier/shifts/${id}/z-report`),
  close: (id) => api.post(`/cashier/shifts/${id}/close`),
};

export const returnApi = {
  getAll: (params) => api.get('/returns', { params }),
  getById: (id) => api.get(`/returns/${id}`),
  updateReason: (id, data) => api.patch(`/returns/${id}`, data),
  delete: (id) => api.delete(`/returns/${id}`),
  exportExcel: (params) => api.get('/returns/export', { params, responseType: 'blob' }),
};

export const reportApi = {
  daily:       (params)      => api.get('/reports/daily', { params }),
  sales:       (from, to)    => api.get('/reports/sales', { params: { from, to } }),
  topProducts: (limit, from, to) =>
    api.get('/reports/top-products', { params: { limit, from, to } }),
  cashierPerf: (from, to)    => api.get('/reports/cashier-performance', { params: { from, to } }),
  salesByProducts: (params) => api.get('/reports/sales/by-products', { params }),
  salesByCategories: (params) => api.get('/reports/sales/by-categories', { params }),
  salesByStores: (params) => api.get('/reports/sales/by-stores', { params }),
  periodCompare: (params) => api.get('/reports/sales/period-compare', { params }),
  exportSalesByProducts: (params) => api.get('/reports/sales/by-products/export', { params, responseType: 'blob' }),
  exportSalesByCategories: (params) => api.get('/reports/sales/by-categories/export', { params, responseType: 'blob' }),
  exportSalesByStores: (params) => api.get('/reports/sales/by-stores/export', { params, responseType: 'blob' }),
  exportPeriodCompare: (params) => api.get('/reports/sales/period-compare/export', { params, responseType: 'blob' }),
  exportDaily: (params) => api.get('/reports/daily/export', { params, responseType: 'blob' }),
  exportCashierPerf: (from, to) => api.get('/reports/cashier-performance/export', { params: { from, to }, responseType: 'blob' }),
};

export const aiAssistantApi = {
  chat: (message, history = []) => api.post('/ai/assistant/chat', { message, history }),
};

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
  exportBalances: (params) => api.get('/reports/stock/balances/export', { params, responseType: 'blob' }),
  exportDeadStock: (params) => api.get('/reports/stock/dead-stock/export', { params, responseType: 'blob' }),
  exportAdjustments: (params) => api.get('/reports/stock/adjustments/export', { params, responseType: 'blob' }),
  exportInventories: (params) => api.get('/reports/stock/inventories/export', { params, responseType: 'blob' }),
  exportTransfers: (params) => api.get('/reports/stock/transfers/export', { params, responseType: 'blob' }),
};

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

export const userApi = {
  getAll:  ()       => api.get('/users'),
  getById: (id)     => api.get(`/users/${id}`),
  create:  (data)   => api.post('/users', data),
  update:  (id, d)  => api.put(`/users/${id}`, d),
  toggle:  (id)     => api.patch(`/users/${id}/toggle-active`),
};

export const categoryApi = {
  getAll:  () => api.get('/categories'),
  create:  (data) => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  delete:  (id) => api.delete(`/categories/${id}`),
};

export const supplierApi = {
  getAll: (params) => api.get('/suppliers', { params }),
  create: (data) => api.post('/suppliers', data),
};

export const tenantDisplayApi = {
  get: () => api.get('/tenant-display-settings'),
  save: (data) => api.put('/tenant-display-settings', data),
};

export const companyBusinessTypeApi = {
  get: () => api.get('/company-business-type'),
};

export const unitsApi = {
  list: (params) => api.get('/units', { params }),
  conversions: () => api.get('/units/conversions'),
};

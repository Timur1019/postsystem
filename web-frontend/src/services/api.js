// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

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

// ---- Response interceptor: handle 401 ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { token, logout, setToken } = useAuthStore.getState();
      const jwtParts = typeof token === 'string' ? token.split('.').length : 0;
      if (!token || jwtParts !== 3) {
        logout();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToken(res.data.token);
        original.headers.Authorization = `Bearer ${res.data.token}`;
        return api(original);
      } catch {
        logout();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ---- Typed API modules ----
export const authApi = {
  login:   (data) => api.post('/auth/login', data),
  register:(data) => api.post('/auth/register', data),
};

export const tasnifApi = {
  search: (params) => api.get('/tasnif/mxik/search', { params }),
  detail: (params) => api.get('/tasnif/mxik/detail', { params }),
  lookup: (params) => api.get('/tasnif/mxik/lookup', { params }),
};

export const productApi = {
  getAll:     (params) => api.get('/products', { params }),
  getById:    (id)     => api.get(`/products/${id}`),
  getByBarcode: (barcode, storeId) =>
    api.get(`/products/barcode/${encodeURIComponent(barcode)}`, {
      params: storeId != null ? { storeId } : undefined,
    }),
  create:     (data)   => api.post('/products', data),
  update:     (id, d)  => api.put(`/products/${id}`, d),
  adjustStock:(id, q, type, notes) =>
    api.patch(`/products/${id}/stock`, null, { params: { quantity: q, movementType: type, notes } }),
  deactivate: (id)     => api.delete(`/products/${id}`),
  getLowStock:()       => api.get('/products/low-stock'),
  bulkTaxRate:(body)   => api.patch('/products/bulk/tax-rate', body),
  importTemplate: () =>
    api.get('/products/import/template', { responseType: 'blob' }),
  importPreview: (formData, source = 'CATALOG') =>
    api.post('/products/import/preview', formData, {
      params: { source },
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
};

export const companyApi = {
  getAll: (params) => api.get('/companies', { params }),
  listAll: () => api.get('/companies/all'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

export const cashRegisterApi = {
  getAll: (params) => api.get('/cash-registers', { params }),
  getTransfers: (params) => api.get('/cash-registers/transfers', { params }),
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
  getReceipt: (num)    => api.get(`/sales/receipt/${num}`),
  voidSale:   (id, reason) =>
    api.post(`/sales/${id}/void`, null, { params: { reason } }),
  mySales:    (params) => api.get('/sales/my-sales', { params }),
};

export const cashierShiftApi = {
  current: (storeId) => api.get('/cashier/shifts/current', { params: { storeId } }),
  open: (storeId) => api.post('/cashier/shifts/open', null, { params: { storeId } }),
  xReport: (id) => api.get(`/cashier/shifts/${id}/x-report`),
  zReport: (id) => api.get(`/cashier/shifts/${id}/z-report`),
  close: (id) => api.post(`/cashier/shifts/${id}/close`),
};

export const returnApi = {
  getAll: (params) => api.get('/returns', { params }),
};

export const reportApi = {
  daily:       (date)        => api.get('/reports/daily', { params: { date } }),
  sales:       (from, to)    => api.get('/reports/sales', { params: { from, to } }),
  topProducts: (limit, from, to) =>
    api.get('/reports/top-products', { params: { limit, from, to } }),
  cashierPerf: (from, to)    => api.get('/reports/cashier-performance', { params: { from, to } }),
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

export const warehouseApi = {
  getProducts: (params) => api.get('/warehouse/products', { params }),
  receipt: (data) => api.post('/warehouse/receipt', data),
};

export const supplierApi = {
  getAll: (params) => api.get('/suppliers', { params }),
  create: (data) => api.post('/suppliers', data),
};

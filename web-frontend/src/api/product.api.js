import { api } from './client';

export const productApi = {
  getAll: (params, config) => api.get('/products', { params, ...config }),
  getById: (id, params) => api.get(`/products/${id}`, { params }),
  lifecycle: (id, params) => api.get(`/products/${id}/lifecycle`, { params }),
  getByBarcode: (barcode, storeId) =>
    api.get(`/products/barcode/${encodeURIComponent(barcode)}`, {
      params: storeId != null ? { storeId } : undefined,
    }),
  create: (data) => api.post('/products', data),
  update: (id, d) => api.put(`/products/${id}`, d),
  adjustStock: (id, q, type, notes, storeId) =>
    api.patch(`/products/${id}/stock`, null, {
      params: {
        quantity: q,
        movementType: type,
        notes,
        ...(storeId != null ? { storeId } : {}),
      },
    }),
  deactivate: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  bulkTaxRate: (body) => api.patch('/products/bulk/tax-rate', body),
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

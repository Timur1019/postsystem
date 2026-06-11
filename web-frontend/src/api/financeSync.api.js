import { api } from './client';

export const financeSyncApi = {
  backfill: (params) => api.post('/admin/finance-sync/backfill', null, { params }),
  outbox: (params) => api.get('/admin/finance-sync/outbox', { params }),
  retryOutbox: (id) => api.post(`/admin/finance-sync/outbox/${id}/retry`),
  retryPending: () => api.post('/admin/finance-sync/retry-pending'),
};

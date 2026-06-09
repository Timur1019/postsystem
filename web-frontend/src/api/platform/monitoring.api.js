import { api } from '../client';

export const platformMonitoringApi = {
  overview: () => api.get('/platform/monitoring/overview'),
  metrics: (search) => api.get('/platform/monitoring/metrics', { params: { search } }),
  metricDetail: (name) =>
    api.get(`/platform/monitoring/metrics/${encodeURIComponent(name)}`),
  logs: (params) => api.get('/platform/monitoring/logs', { params }),
  clearLogs: () => api.delete('/platform/monitoring/logs'),
};

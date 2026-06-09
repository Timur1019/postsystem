import { api } from './client';

export const tasnifApi = {
  search: (params) => api.get('/tasnif/mxik/search', { params }),
  detail: (params) => api.get('/tasnif/mxik/detail', { params }),
  lookup: (params) => api.get('/tasnif/mxik/lookup', { params }),
};

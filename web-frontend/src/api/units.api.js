import { api } from './client';

export const unitsApi = {
  list: (params) => api.get('/units', { params }),
  conversions: () => api.get('/units/conversions'),
};

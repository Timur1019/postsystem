import { api } from './client';

export const companyBusinessTypeApi = {
  get: () => api.get('/company-business-type'),
};

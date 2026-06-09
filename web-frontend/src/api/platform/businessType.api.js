import { api } from '../client';

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

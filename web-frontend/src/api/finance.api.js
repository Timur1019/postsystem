import { api } from './client';

export const financeApi = {
  dashboard: (params) => api.get('/finance/dashboard', { params: params ?? {} }),
  accounts: {
    list: () => api.get('/finance/accounts'),
    create: (data) => api.post('/finance/accounts', data),
    update: (id, data) => api.put(`/finance/accounts/${id}`, data),
  },
  incomes: {
    list: (params) => api.get('/finance/incomes', { params }),
    create: (data) => api.post('/finance/incomes', data),
    update: (id, data) => api.put(`/finance/incomes/${id}`, data),
    delete: (id) => api.delete(`/finance/incomes/${id}`),
  },
  expenses: {
    list: (params) => api.get('/finance/expenses', { params }),
    create: (data) => api.post('/finance/expenses', data),
    update: (id, data) => api.put(`/finance/expenses/${id}`, data),
    delete: (id) => api.delete(`/finance/expenses/${id}`),
  },
  categories: {
    income: () => api.get('/finance/categories/income'),
    expense: () => api.get('/finance/categories/expense'),
    createIncome: (data) => api.post('/finance/categories/income', data),
    createExpense: (data) => api.post('/finance/categories/expense', data),
    toggleIncome: (id, active) => api.patch(`/finance/categories/income/${id}`, null, { params: { active } }),
    toggleExpense: (id, active) => api.patch(`/finance/categories/expense/${id}`, null, { params: { active } }),
  },
  transfers: {
    list: (params) => api.get('/finance/transfers', { params }),
    create: (data) => api.post('/finance/transfers', data),
  },
  audit: {
    logs: (params) => api.get('/finance/audit/logs', { params }),
    export: (params) => api.get('/finance/audit/logs/export', { params, responseType: 'blob' }),
  },
  reports: {
    profitLoss: (params) => api.get('/finance/reports/profit-loss', { params }),
    exportProfitLoss: (params) => api.get('/finance/reports/profit-loss/export', { params, responseType: 'blob' }),
    cashFlow: (params) => api.get('/finance/reports/cash-flow', { params }),
    exportCashFlow: (params) => api.get('/finance/reports/cash-flow/export', { params, responseType: 'blob' }),
  },
  debts: {
    customers: {
      list: () => api.get('/finance/debts/customers'),
      entries: (customerId) => api.get(`/finance/debts/customers/${customerId}/entries`),
      pay: (customerId, data) => api.post(`/finance/debts/customers/${customerId}/pay`, data),
    },
    suppliers: {
      list: () => api.get('/finance/debts/suppliers'),
      entries: (supplierId) => api.get(`/finance/debts/suppliers/${supplierId}/entries`),
      pay: (supplierId, data) => api.post(`/finance/debts/suppliers/${supplierId}/pay`, data),
    },
    advances: {
      list: () => api.get('/finance/advances/customers'),
      balance: (customerId) => api.get(`/finance/advances/customers/${customerId}/balance`),
      entries: (customerId) => api.get(`/finance/advances/customers/${customerId}/entries`),
      apply: (customerId, data) => api.post(`/finance/advances/customers/${customerId}/apply`, data),
    },
  },
};

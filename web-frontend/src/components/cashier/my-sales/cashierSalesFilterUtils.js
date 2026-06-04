import { CASHIER_SALES_PAGE_SIZE } from './cashierSalesConstants';

export function hasActiveCashierSalesFilters(filters) {
  return Boolean(
    filters.receiptNumber?.trim() ||
      filters.paymentMethod ||
      filters.status ||
      filters.from ||
      filters.to
  );
}

export function normalizeCashierSalesFilters(filters) {
  let { from, to } = filters;
  if (from && to && from > to) {
    [from, to] = [to, from];
  }
  return { ...filters, from, to };
}

export function buildCashierSalesQueryParams(filters, page) {
  const params = { page, size: CASHIER_SALES_PAGE_SIZE };
  if (filters.receiptNumber?.trim()) params.receiptNumber = filters.receiptNumber.trim();
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  return params;
}

export const CASHIER_SALES_PAGE_SIZE = 14;
export const CASHIER_SALES_RECEIPT_DEBOUNCE_MS = 400;
export const CASHIER_SALES_VIEW_STORAGE_KEY = 'cashier-sales-view-mode';

export const CASHIER_SALES_EMPTY_FILTERS = {
  receiptNumber: '',
  paymentMethod: '',
  status: '',
  from: '',
  to: '',
};

export function readCashierSalesViewMode() {
  try {
    const v = localStorage.getItem(CASHIER_SALES_VIEW_STORAGE_KEY);
    if (v === 'list' || v === 'cards') return v;
  } catch {
    /* ignore */
  }
  return 'list';
}

export const STOCK_PAGE_SIZE_DEFAULT = 14;

export const STOCK_PRODUCT_DEFAULT_FILTERS = {
  barcode: '',
  markedProduct: '',
};

export const canManageStock = (role) => role === 'ADMIN' || role === 'MANAGER';

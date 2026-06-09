export const PRODUCT_DEFAULT_FILTERS = {
  ikpuStatus: 'ALL',
  storeId: '',
  barcode: '',
  categoryId: '',
  soldIndividually: '',
  markedProduct: '',
  deletedScope: 'ACTIVE',
};

export const SUPPLIER_DEFAULT_FILTERS = {
  createdOn: '',
};

export function canManageCatalog(role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

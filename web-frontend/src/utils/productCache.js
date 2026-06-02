const PRODUCT_QUERY_SEGMENTS = [
  'products',
  'product',
  'warehouse-products',
  'pos-products',
  'dashboard-low-stock',
  'low-stock',
  'reports-low-stock',
];

function isProductQueryKey(queryKey) {
  if (!Array.isArray(queryKey)) return false;
  if (queryKey[0] === 'tenant' && queryKey.length > 2) {
    return PRODUCT_QUERY_SEGMENTS.includes(queryKey[2]);
  }
  return PRODUCT_QUERY_SEGMENTS.includes(queryKey[0]);
}

/**
 * Инвалидирует все кэши, где отображается остаток товара.
 * Каталог (/products), склад (/stock/products) и касса используют одно поле stockQuantity в БД.
 */
export function invalidateProductCaches(qc) {
  qc.invalidateQueries({ predicate: ({ queryKey }) => isProductQueryKey(queryKey) });
}

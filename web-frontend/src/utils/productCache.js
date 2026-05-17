/**
 * Инвалидирует все кэши, где отображается остаток товара.
 * Каталог (/products), склад (/stock/products) и касса используют одно поле stockQuantity в БД.
 */
export function invalidateProductCaches(qc) {
  qc.invalidateQueries({ queryKey: ['products'] });
  qc.invalidateQueries({ queryKey: ['warehouse-products'] });
  qc.invalidateQueries({ queryKey: ['pos-products'] });
  qc.invalidateQueries({ queryKey: ['low-stock'] });
}

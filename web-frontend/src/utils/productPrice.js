/** Цена для кассы: цена магазина из storePrices, иначе sellingPrice. */
export function resolveProductUnitPrice(product, storeId) {
  const base = Number(product?.sellingPrice) || 0;
  if (storeId == null || !product?.storePrices?.length) return base;
  const row = product.storePrices.find((sp) => sp.storeId === storeId);
  if (row == null) return base;
  const price = Number(row.price);
  return Number.isFinite(price) && price > 0 ? price : base;
}

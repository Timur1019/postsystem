/** Цены по магазинам для API: пустое поле → базовая цена продажи. */
export function buildStorePrices(rows, sellingPrice) {
  const base = Number(sellingPrice);
  if (!Number.isFinite(base) || base <= 0) return [];
  return rows
    .filter((r) => r.storeId !== '' && r.storeId != null)
    .map((r) => {
      const parsed = r.price === '' || r.price == null ? NaN : Number(r.price);
      const price = Number.isFinite(parsed) && parsed > 0 ? parsed : base;
      return { storeId: Number(r.storeId), price };
    });
}

/**
 * Подставляет цену продажи в строки магазинов, если цена не задана,
 * совпадает с прежней ценой продажи или ошибочно равна себестоимости.
 */
export function syncStoreRowPrices(rows, nextSelling, prevSelling, costPrice) {
  const next = Number(nextSelling);
  if (!Number.isFinite(next) || next <= 0) return rows;
  const prev = prevSelling != null && prevSelling !== '' ? Number(prevSelling) : null;
  const cost = costPrice != null && costPrice !== '' ? Number(costPrice) : null;

  return rows.map((r) => {
    if (r.storeId === '' || r.storeId == null) return r;
    const p = r.price === '' || r.price == null ? NaN : Number(r.price);
    const matchesPrev = prev != null && Number.isFinite(prev) && p === prev;
    const matchesCost =
      cost != null && Number.isFinite(cost) && p === cost && cost !== next;
    const empty = !Number.isFinite(p) || p <= 0;
    if (empty || matchesPrev || matchesCost) {
      return { ...r, price: String(next) };
    }
    return r;
  });
}

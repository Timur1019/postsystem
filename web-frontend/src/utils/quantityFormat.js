/** Количество с точностью 3 знака (кг / шт). */

export const QTY_SCALE = 3;

export function roundQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}

export function qtyUnitLabel(unitCode) {
  if (unitCode === 'G') return 'г';
  if (unitCode === 'L') return 'л';
  if (unitCode === 'M') return 'м';
  return 'кг';
}

export function formatQty(value, saleType, unitCode) {
  const parts = formatQtyParts(value, saleType, unitCode);
  return parts.unit ? `${parts.number} ${parts.unit}` : parts.number;
}

/** Число и единица отдельно — для компактного отображения в чеке. */
export function formatQtyParts(value, saleType, unitCode) {
  const q = roundQty(value);
  const scale = productQuantityScale({ saleType, quantityScale: saleType === 'WEIGHT' ? 3 : 0 });
  const formatted = q.toFixed(scale).replace(/\.?0+$/, '') || '0';
  if (saleType === 'WEIGHT' || unitCode === 'KG' || unitCode === 'G' || unitCode === 'L' || unitCode === 'M') {
    return { number: formatted, unit: qtyUnitLabel(unitCode) };
  }
  if (Number.isInteger(q) || Math.abs(q - Math.round(q)) < 0.0005) {
    return { number: String(Math.round(q)), unit: null };
  }
  return { number: q.toFixed(3).replace(/\.?0+$/, ''), unit: null };
}

export function qtyToEditString(value, saleType) {
  const q = roundQty(value);
  if (saleType === 'WEIGHT') {
    return q.toFixed(3).replace(/\.?0+$/, '') || '0';
  }
  return String(Math.max(1, Math.round(q)));
}

export function parseQtyInput(raw, saleType) {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (saleType === 'WEIGHT') return roundQty(n);
  return Math.max(1, Math.round(n));
}

export function productQuantityScale(product) {
  if (product?.quantityScale != null) return Math.min(3, Math.max(0, Number(product.quantityScale)));
  return product?.saleType === 'WEIGHT' ? 3 : 0;
}

export function isWeightProduct(product) {
  return product?.saleType === 'WEIGHT';
}

export function isPieceLikeProduct(product) {
  const t = product?.saleType;
  return !t || t === 'PIECE' || t === 'SERVICE';
}

export function qtyFromAmount(amount, unitPrice) {
  const price = Number(unitPrice);
  const sum = Number(amount);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(sum) || sum <= 0) {
    return 0;
  }
  return roundQty(sum / price);
}

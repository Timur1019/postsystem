/** Количество с точностью 3 знака (кг / шт). */

import { round2 } from './taxAmounts';

export const QTY_SCALE = 3;
export const MIN_WEIGHT_KG = 0.001;

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
  return weightLineFromAmount(amount, unitPrice).qty;
}

/**
 * Ввод по сумме: подбирает кг (3 знака) и цену за кг так, чтобы итог строки = введённой сумме.
 */
export function weightLineFromAmount(amount, catalogUnitPrice) {
  const targetSum = round2(amount);
  const catalogPrice = Number(catalogUnitPrice);
  if (!Number.isFinite(targetSum) || targetSum <= 0 || !Number.isFinite(catalogPrice) || catalogPrice <= 0) {
    return { qty: 0, unitPrice: catalogPrice, lineSum: 0 };
  }

  const idealQty = targetSum / catalogPrice;
  const baseQty = roundQty(idealQty);
  let best = null;

  for (let step = -25; step <= 25; step += 1) {
    const qty = roundQty(baseQty + step * 0.001);
    if (qty < MIN_WEIGHT_KG) continue;
    const unitPrice = round2(targetSum / qty);
    const lineSum = round2(qty * unitPrice);
    if (lineSum !== targetSum) continue;
    const candidate = { qty, unitPrice, lineSum };
    if (
      !best ||
      Math.abs(candidate.qty - idealQty) < Math.abs(best.qty - idealQty)
    ) {
      best = candidate;
    }
  }

  if (best) return best;

  const qty = baseQty >= MIN_WEIGHT_KG ? baseQty : 0;
  const unitPrice = qty > 0 ? round2(targetSum / qty) : catalogPrice;
  return { qty, unitPrice, lineSum: round2(qty * unitPrice) };
}

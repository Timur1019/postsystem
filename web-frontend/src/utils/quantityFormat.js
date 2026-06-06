/** Количество с точностью до 3 знаков (кг, м, л / шт). */

import { round2 } from './taxAmounts';
import { getUnitConfig, isMeasuredProduct, isMeasuredUnitCode } from './unitConfig';

export const QTY_SCALE = 3;
export const MIN_WEIGHT_KG = 0.001;

export { isMeasuredProduct };

/** @deprecated use isMeasuredProduct */
export const isWeightProduct = isMeasuredProduct;

export function roundQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}

export function qtyUnitLabel(unitCode) {
  return getUnitConfig(unitCode).label;
}

export function formatQty(value, saleType, unitCode) {
  const parts = formatQtyParts(value, saleType, unitCode);
  return parts.unit ? `${parts.number} ${parts.unit}` : parts.number;
}

/** Число и единица отдельно — для компактного отображения в чеке. */
export function formatQtyParts(value, saleType, unitCode) {
  const code = unitCode || (saleType === 'WEIGHT' ? 'KG' : 'PCS');
  const config = getUnitConfig(code);
  const q = config.scale === 0 ? Math.round(Number(value) || 0) : roundQty(value);
  const scale = productQuantityScale({ saleType, unitCode: code, quantityScale: config.scale });
  const formatted = q.toFixed(scale).replace(/\.?0+$/, '') || '0';
  if (saleType === 'WEIGHT' || isMeasuredUnitCode(code)) {
    return { number: formatted, unit: config.label };
  }
  if (Number.isInteger(q) || Math.abs(q - Math.round(q)) < 0.0005) {
    return { number: String(Math.round(q)), unit: null };
  }
  return { number: q.toFixed(3).replace(/\.?0+$/, ''), unit: null };
}

export function qtyToEditString(value, saleType, unitCode) {
  const code = unitCode || (saleType === 'WEIGHT' ? 'KG' : 'PCS');
  const config = getUnitConfig(code);
  const q = config.scale === 0 ? Math.round(Number(value) || 0) : roundQty(value);
  if (saleType === 'WEIGHT') {
    return q.toFixed(config.scale).replace(/\.?0+$/, '') || '0';
  }
  return String(Math.max(1, Math.round(q)));
}

export function parseQtyInput(raw, saleType, unitCode) {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  const code = unitCode || (saleType === 'WEIGHT' ? 'KG' : 'PCS');
  const config = getUnitConfig(code);
  if (saleType === 'WEIGHT') {
    return config.scale === 0 ? Math.max(config.minQty, Math.round(n)) : roundQty(n);
  }
  return Math.max(1, Math.round(n));
}

export function productQuantityScale(product) {
  if (product?.quantityScale != null) return Math.min(3, Math.max(0, Number(product.quantityScale)));
  const code = product?.unitCode || (product?.saleType === 'WEIGHT' ? 'KG' : 'PCS');
  return getUnitConfig(code).scale;
}

export function isPieceLikeProduct(product) {
  const t = product?.saleType;
  return !t || t === 'PIECE' || t === 'SERVICE';
}

export function minQtyForUnit(unitCode) {
  return getUnitConfig(unitCode).minQty;
}

export function qtyStepForUnit(unitCode) {
  return getUnitConfig(unitCode).step;
}

export function qtyFromAmount(amount, unitPrice, unitCode = 'KG') {
  return measuredLineFromAmount(amount, unitPrice, unitCode).qty;
}

/**
 * Ввод по сумме: подбирает количество и цену за единицу так, чтобы итог строки = введённой сумме.
 */
export function measuredLineFromAmount(amount, catalogUnitPrice, unitCode = 'KG') {
  const config = getUnitConfig(unitCode);
  if (config.scale === 0) {
    return integerMeasuredLineFromAmount(amount, catalogUnitPrice, config.minQty);
  }
  return decimalMeasuredLineFromAmount(amount, catalogUnitPrice, config.minQty);
}

/** @deprecated use measuredLineFromAmount */
export function weightLineFromAmount(amount, catalogUnitPrice) {
  return measuredLineFromAmount(amount, catalogUnitPrice, 'KG');
}

function decimalMeasuredLineFromAmount(amount, catalogUnitPrice, minQty) {
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
    if (qty < minQty) continue;
    const unitPrice = round2(targetSum / qty);
    const lineSum = round2(qty * unitPrice);
    if (lineSum !== targetSum) continue;
    const candidate = { qty, unitPrice, lineSum };
    if (!best || Math.abs(candidate.qty - idealQty) < Math.abs(best.qty - idealQty)) {
      best = candidate;
    }
  }

  if (best) return best;

  const qty = baseQty >= minQty ? baseQty : 0;
  const unitPrice = qty > 0 ? round2(targetSum / qty) : catalogPrice;
  return { qty, unitPrice, lineSum: round2(qty * unitPrice) };
}

function integerMeasuredLineFromAmount(amount, catalogUnitPrice, minQty) {
  const targetSum = round2(amount);
  const catalogPrice = Number(catalogUnitPrice);
  if (!Number.isFinite(targetSum) || targetSum <= 0 || !Number.isFinite(catalogPrice) || catalogPrice <= 0) {
    return { qty: 0, unitPrice: catalogPrice, lineSum: 0 };
  }

  const idealQty = targetSum / catalogPrice;
  const baseQty = Math.max(minQty, Math.round(idealQty));
  let best = null;

  for (let step = -25; step <= 25; step += 1) {
    const qty = Math.max(minQty, baseQty + step);
    const unitPrice = round2(targetSum / qty);
    const lineSum = round2(qty * unitPrice);
    if (lineSum !== targetSum) continue;
    const candidate = { qty, unitPrice, lineSum };
    if (!best || Math.abs(candidate.qty - idealQty) < Math.abs(best.qty - idealQty)) {
      best = candidate;
    }
  }

  if (best) return best;

  const qty = baseQty >= minQty ? baseQty : 0;
  const unitPrice = qty > 0 ? round2(targetSum / qty) : catalogPrice;
  return { qty, unitPrice, lineSum: round2(qty * unitPrice) };
}

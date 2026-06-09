import { roundQty } from '../../../utils/quantityFormat';

export function displayQtyValue(qty, scale) {
  if (qty == null || !Number.isFinite(Number(qty))) return '—';
  const q = scale === 0 ? Math.round(Number(qty)) : roundQty(qty);
  return q.toFixed(scale).replace(/\.?0+$/, '') || '0';
}

export function parseDecimalInput(raw) {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

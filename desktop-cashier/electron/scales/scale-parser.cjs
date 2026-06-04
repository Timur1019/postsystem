/**
 * Разбор строк с весов (CAS, Mettler, generic RS-232).
 * Возвращает вес в килограммах.
 */

function toNumber(s) {
  const n = Number(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseScaleLine(line) {
  const raw = String(line ?? '').trim();
  if (!raw || raw.length < 2) return null;

  const unstable = /\bUS\b|unstable|motion/i.test(raw);
  const stableHint = /\bST\b|\bGS\b|stable|fixed/i.test(raw);
  const stable = stableHint || !unstable;

  const match =
    raw.match(/([+-]?\d+[.,]\d+)\s*(kg|кг|g|г)\b/i) ||
    raw.match(/([+-]?\d+[.,]\d+)/);

  if (!match) return null;

  let value = toNumber(match[1]);
  if (value == null) return null;

  const unit = (match[2] || 'kg').toLowerCase();
  if (unit === 'g' || unit === 'г') {
    value = value / 1000;
  }

  if (value < 0) value = Math.abs(value);
  if (value > 500) return null;

  return {
    kg: Math.round(value * 1000) / 1000,
    stable,
    raw,
  };
}

module.exports = { parseScaleLine };

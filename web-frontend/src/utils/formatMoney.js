/** Суммы и количества для POS / отчётов (ru-RU, 2 знака). */

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtMoney(n) {
  return moneyFormatter.format(Number(n) || 0);
}

export function fmtQty(q) {
  const n = Number(q) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Целые числа (клавиатура, счётчики). */
export function fmtInteger(n) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(n) || 0);
}

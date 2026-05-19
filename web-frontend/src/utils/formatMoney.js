/** Суммы и количества для POS / отчётов (ru-RU, 2 знака). */

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtMoney(n) {
  return moneyFormatter.format(Number(n) || 0);
}

const moneyCompactInt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** Для узких колонок кассы: без «,00», если копеек нет. */
export function fmtMoneyCompact(n) {
  const val = Number(n) || 0;
  const rounded = Math.round(val * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
    return moneyCompactInt.format(rounded);
  }
  return moneyFormatter.format(rounded);
}

export function fmtQty(q) {
  const n = Number(q) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Целые числа (клавиатура, счётчики). */
export function fmtInteger(n) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(n) || 0);
}

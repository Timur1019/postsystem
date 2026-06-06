/** Суммы и количества для POS / отчётов (ru-RU, 2 знака). */

import { getUnitConfig } from './unitConfig';

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

export function fmtQty(q, saleType, unitCode) {
  if (saleType === 'WEIGHT') {
    const code = unitCode || 'KG';
    const config = getUnitConfig(code);
    const n = Number(q) || 0;
    const rounded = config.scale === 0 ? Math.round(n) : Math.round(n * 1000) / 1000;
    const formatted = rounded.toFixed(config.scale).replace(/\.?0+$/, '') || '0';
    return `${formatted} ${config.label}`;
  }
  const n = Number(q) || 0;
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.0005) {
    return String(Math.round(n));
  }
  return (Math.round(n * 1000) / 1000).toFixed(3);
}

/** Целые числа (клавиатура, счётчики). */
export function fmtInteger(n) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(n) || 0);
}

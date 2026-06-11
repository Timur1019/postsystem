export function formatMoney(value, currency = 'UZS') {
  const num = Number(value ?? 0);
  return `${num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

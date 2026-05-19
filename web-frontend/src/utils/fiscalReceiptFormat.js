/** Данные для QR / фискального признака на чеке. */
export { fmtMoney, fmtQty } from './formatMoney';

/** Уникальный фискальный признак (до интеграции с ОФД — детерминированно из данных чека). */
export function buildFiscalSign(sale) {
  const base = `${sale.receiptNumber}|${sale.id}|${sale.totalAmount}|${sale.createdAt}`;
  let h = 0;
  for (let i = 0; i < base.length; i += 1) {
    h = (Math.imul(31, h) + base.charCodeAt(i)) >>> 0;
  }
  return String(h % 1_000_000_000_000).padStart(12, '0');
}

/** Payload для QR (проверка чека / призовые игры). */
export function buildQrPayload(sale) {
  const customBase = import.meta.env.VITE_FISCAL_QR_BASE?.trim();
  const sign = buildFiscalSign(sale);
  const total = Number(sale.totalAmount) || 0;
  const r = encodeURIComponent(sale.receiptNumber || '');
  if (customBase) {
    const sep = customBase.includes('?') ? '&' : '?';
    return `${customBase}${sep}r=${r}&s=${total}&f=${sign}`;
  }
  const t = sale.createdAt ? new Date(sale.createdAt).getTime() : Date.now();
  return `https://ofd.soliq.uz/check?r=${r}&s=${total}&t=${t}&f=${sign}`;
}

export function splitDateTime(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    };
  } catch {
    return { date: '—', time: '—' };
  }
}

/** Форматирование сумм/дат/QR для ESC/POS (без Vite env — branding в payload). */

/**
 * Деньги: 2 знака, пробелы тысяч.
 * @param {number|string} value
 * @returns {string}
 */
function fmtMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Количество без лишних нулей.
 * @param {number|string} value
 * @returns {string}
 */
function fmtQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');
}

/**
 * Дата и время чека из ISO.
 * @param {string} iso
 * @returns {{ date: string, time: string }}
 */
function splitDateTime(iso) {
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

/**
 * Фискальный признак (до ОФД — детерминированно из данных чека).
 * @param {object} sale
 * @returns {string}
 */
function buildFiscalSign(sale) {
  const base = `${sale.receiptNumber}|${sale.id}|${sale.totalAmount}|${sale.createdAt}`;
  let h = 0;
  for (let i = 0; i < base.length; i += 1) {
    h = (Math.imul(31, h) + base.charCodeAt(i)) >>> 0;
  }
  return String(h % 1_000_000_000_000).padStart(12, '0');
}

/**
 * Строка для QR на чеке.
 * @param {object} sale
 * @param {string} [qrBase] — опционально из payload.branding.qrBase
 * @returns {string}
 */
function buildQrPayload(sale, qrBase) {
  const sign = buildFiscalSign(sale);
  const total = Number(sale.totalAmount) || 0;
  const r = encodeURIComponent(sale.receiptNumber || '');
  const base = String(qrBase || '').trim();
  if (base) {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}r=${r}&s=${total}&f=${sign}`;
  }
  const t = sale.createdAt ? new Date(sale.createdAt).getTime() : Date.now();
  return `https://ofd.soliq.uz/check?r=${r}&s=${total}&t=${t}&f=${sign}`;
}

/**
 * НДС по строке (если нет taxAmount в sale item).
 * @param {object} item
 * @returns {number}
 */
function lineVatAmount(item) {
  const stored = Number(item?.taxAmount);
  if (Number.isFinite(stored) && stored >= 0.001) return stored;
  const rate = item?.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
  const lineTotal = Number(item?.lineTotal) || 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return (lineTotal * rate) / (100 + rate);
}

/**
 * dd.MM.yyyy HH:mm из ISO.
 * @param {string|Date|null|undefined} iso
 * @returns {string}
 */
function fmtAt(iso) {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '—';
  }
}

module.exports = {
  fmtMoney,
  fmtQty,
  splitDateTime,
  buildFiscalSign,
  buildQrPayload,
  lineVatAmount,
  fmtAt,
};

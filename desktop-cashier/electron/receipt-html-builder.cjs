const { RECEIPT_PRINT_CSS } = require('./receipt-print-styles.cjs');

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function fmtQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');
}

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

function buildFiscalSign(sale) {
  const base = `${sale.receiptNumber}|${sale.id}|${sale.totalAmount}|${sale.createdAt}`;
  let h = 0;
  for (let i = 0; i < base.length; i += 1) {
    h = (Math.imul(31, h) + base.charCodeAt(i)) >>> 0;
  }
  return String(h % 1_000_000_000_000).padStart(12, '0');
}

function row(label, value, bold = false) {
  return `<div class="receipt-row${bold ? ' receipt-row--bold' : ''}"><span class="receipt-meta-label">${esc(label)}</span><span class="receipt-row__value">${esc(value)}</span></div>`;
}

function paymentLabel(method) {
  const map = { CASH: 'Наличные', CARD: 'Карта', MPESA: 'Mpesa', MIXED: 'Смешанная' };
  return map[method] || method || '—';
}

/**
 * HTML тела чека из JSON продажи (без React/Tailwind).
 * @param {object} sale — ответ POST /sales
 * @param {{ companyName?: string, companyAddress?: string, stir?: string, logoDataUrl?: string }} branding
 */
function buildReceiptBodyHtml(sale, branding = {}) {
  if (!sale) return '';
  const { date, time } = splitDateTime(sale.createdAt);
  const companyName = branding.companyName || sale.storeName || 'AURENT';
  const companyAddress = branding.companyAddress || '';
  const stir = branding.stir || '';
  const fiscalSign = buildFiscalSign(sale);
  const total = Number(sale.totalAmount) || 0;
  const method = sale.paymentMethod;
  const cashAmt =
    method === 'CASH'
      ? Number(sale.amountTendered) || total
      : method === 'MIXED'
        ? Number(sale.cashAmount) || 0
        : 0;
  const cardAmt =
    method === 'CARD'
      ? Number(sale.amountTendered) || total
      : method === 'MIXED'
        ? Number(sale.cardAmount) || 0
        : 0;
  const change = Number(sale.changeGiven) || 0;

  const itemsHtml = (sale.items || [])
    .map(
      (item) => `<div class="receipt-items-table__item">
  <div class="receipt-items-table__row">
    <span class="receipt-items-table__name">${esc(item.productName)}</span>
    <span class="receipt-items-table__qty">${fmtQty(item.quantity)}</span>
    <span class="receipt-items-table__sum">${fmtMoney(item.lineTotal)}</span>
  </div>
</div>`
    )
    .join('\n');

  const logo = branding.logoDataUrl
    ? `<img class="receipt-logo" src="${esc(branding.logoDataUrl)}" alt="" />`
    : '';
  const qr = sale.qrDataUrl
    ? `<img class="receipt-qr" src="${esc(sale.qrDataUrl)}" alt="" width="112" height="112" />`
    : '';

  return `<div id="receipt-print-area" class="receipt-print-root">
  <header class="receipt-section receipt-section--center">
    ${logo}
    <p class="receipt-title">${esc(companyName)}</p>
    ${companyAddress ? `<p class="receipt-subtitle">${esc(companyAddress)}</p>` : ''}
    ${stir ? `<p class="receipt-subtitle">СТИР: ${esc(stir)}</p>` : ''}
  </header>
  <section class="receipt-section">
    <div class="receipt-meta-grid">
      <div><span class="receipt-meta-label">Дата: </span>${esc(date)}</div>
      <div style="text-align:right"><span class="receipt-meta-label">Время: </span>${esc(time)}</div>
      <div class="receipt-meta-grid__full"><span class="receipt-meta-label">Чек: </span>№${esc(sale.receiptNumber)}</div>
      <div class="receipt-meta-grid__full"><span class="receipt-meta-label">Кассир: </span>${esc(sale.cashierName)}</div>
    </div>
  </section>
  <div class="receipt-divider"></div>
  <section class="receipt-section">
    <div class="receipt-items-table__head">
      <span>Товар</span><span>Кол</span><span>Сумма</span>
    </div>
    ${itemsHtml}
  </section>
  <div class="receipt-divider"></div>
  ${Number(sale.discountTotal) > 0 ? row('Скидка', `${fmtMoney(sale.discountTotal)} сум`) : ''}
  ${row('ИТОГО', `${fmtMoney(sale.totalAmount)} сум`, true)}
  ${row('НДС', `${fmtMoney(sale.taxTotal)} сум`, true)}
  <div class="receipt-divider"></div>
  ${row('Оплата', paymentLabel(method))}
  ${cashAmt > 0 ? row('Наличные', `${fmtMoney(cashAmt)} сум`) : ''}
  ${cardAmt > 0 ? row('Карта', `${fmtMoney(cardAmt)} сум`) : ''}
  ${change > 0 ? row('Сдача', `${fmtMoney(change)} сум`, true) : ''}
  <div class="receipt-divider"></div>
  <section class="receipt-section">
    <p class="receipt-section-title">Фискальные данные</p>
    ${row('ФМ', esc(sale.receiptNumber))}
    ${row('Фиск. признак', fiscalSign)}
  </section>
  <footer class="receipt-section receipt-section--center">
    ${qr}
    <p class="receipt-footer">Спасибо за покупку!</p>
  </footer>
</div>`;
}

function buildThermalReceiptDocument(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — чек</title>
  <style>${RECEIPT_PRINT_CSS}</style>
</head>
<body>
  ${bodyHtml}
  <script>
    window.__posReceiptReady = true;
    window.dispatchEvent(new CustomEvent('pos-receipt-ready'));
  </script>
</body>
</html>`;
}

function buildReceiptDocumentFromSale(sale, branding) {
  const body = buildReceiptBodyHtml(sale, branding);
  return buildThermalReceiptDocument(body);
}

module.exports = {
  buildReceiptBodyHtml,
  buildThermalReceiptDocument,
  buildReceiptDocumentFromSale,
  fmtMoney,
  buildFiscalSign,
};

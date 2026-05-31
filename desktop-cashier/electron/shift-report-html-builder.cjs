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

function fmtAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '—';
  }
}

function row(label, value, bold = false) {
  return `<div class="receipt-row${bold ? ' receipt-row--bold' : ''}"><span class="receipt-meta-label">${esc(label)}</span><span class="receipt-row__value">${esc(value)}</span></div>`;
}

/**
 * HTML X/Z-отчёта для скрытого окна Electron.
 * @param {object} report — ShiftReportResponse + _labels + _branding
 */
function buildShiftReportBodyHtml(report) {
  if (!report?.reportType) return '';
  const labels = report._labels || {};
  const branding = report._branding || {};
  const title = report.reportType === 'X' ? labels.xReport || 'X-отчёт' : labels.zReport || 'Z-отчёт';
  const currency = labels.currency || 'сум';
  const companyName = branding.companyName || 'AURENT';

  const lines = [
    row(labels.openedAt || 'Открыта', fmtAt(report.openedAt)),
    row(labels.reportAt || 'Отчёт на', fmtAt(report.reportAt)),
    '',
    row(labels.shiftSales || 'Продаж', String(report.saleCount ?? 0)),
    row(labels.shiftTotal || 'Итого', `${fmtMoney(report.totalAmount)} ${currency}`, true),
    row(labels.shiftCash || 'Наличные', `${fmtMoney(report.cashAmount)} ${currency}`),
    row(labels.shiftCard || 'Карта', `${fmtMoney(report.cardAmount)} ${currency}`),
    row(labels.shiftVat || 'НДС', `${fmtMoney(report.vatAmount)} ${currency}`),
  ];

  if (Number(report.lineDiscountTotal ?? 0) > 0) {
    lines.push(
      row(
        labels.lineDiscountsSum || 'Скидки по строкам',
        `${fmtMoney(report.lineDiscountTotal)} ${currency}`
      )
    );
  }
  if (Number(report.orderDiscountTotal ?? 0) > 0) {
    lines.push(
      row(
        labels.orderDiscountSum || 'Скидка на заказ',
        `${fmtMoney(report.orderDiscountTotal)} ${currency}`
      )
    );
  }
  if (Number(report.discountTotal ?? 0) > 0) {
    lines.push(
      row(labels.discountsSum || 'Скидки', `${fmtMoney(report.discountTotal)} ${currency}`, true)
    );
  }

  return `<div id="receipt-print-area" class="receipt-print-root receipt-print-root--shift">
  <header class="receipt-section receipt-section--center">
    <p class="receipt-title">${esc(companyName)}</p>
    <p class="receipt-subtitle">${esc(title)}</p>
    <p class="receipt-subtitle">${esc(report.storeName || '')}</p>
    <p class="receipt-secondary">${esc(report.cashierName || '')}</p>
  </header>
  <div class="receipt-divider"></div>
  <section class="receipt-section">
    ${lines.filter(Boolean).join('\n')}
  </section>
</div>`;
}

function buildShiftReportDocument(report) {
  const body = buildShiftReportBodyHtml(report);
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — ${esc(report.reportType)}-отчёт</title>
  <style>${RECEIPT_PRINT_CSS}</style>
</head>
<body>
  ${body}
  <script>
    window.__posReceiptReady = true;
    window.dispatchEvent(new CustomEvent('pos-receipt-ready'));
  </script>
</body>
</html>`;
}

module.exports = {
  buildShiftReportBodyHtml,
  buildShiftReportDocument,
};

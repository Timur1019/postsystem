/**
 * X / Z отчёт смены (касса) — ESC/POS.
 */
const { fmtMoney, fmtAt } = require('./escpos-format.cjs');
const { appendRow, appendDivider, appendCenterHeader } = require('./escpos-layout.cjs');
const { sanitizePayloadForPrint, preparePrinterEncoding } = require('./escpos-encoding.cjs');

/**
 * @param {object} payload
 */
function validateShiftReportPayload(payload) {
  const report = payload?.report;
  if (!report || typeof report !== 'object') {
    throw new Error('Нет данных отчёта смены');
  }
  if (!report.reportType) {
    throw new Error('Не указан тип отчёта (X/Z)');
  }
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function buildShiftReportOnPrinter(printer, payload) {
  const safe = sanitizePayloadForPrint(payload);
  const { report, labels: L = {} } = safe;
  const cur = L.currency || 'sum';
  const title =
    report.reportType === 'X'
      ? L.xReportTitle || 'X-REPORT'
      : L.zReportTitle || 'Z-REPORT';

  printer.clear();
  preparePrinterEncoding(printer);

  appendCenterHeader(printer, [
    safe.branding?.appName || 'Aurent',
    String(title).toUpperCase(),
    report.storeName || '—',
    report.cashierName || '',
  ]);
  appendDivider(printer);

  appendRow(printer, L.openedAt || 'Opened', fmtAt(report.openedAt));
  appendRow(printer, L.reportAt || 'Report at', fmtAt(report.reportAt));
  appendDivider(printer);

  appendRow(printer, L.shiftSales || 'Sales', String(report.saleCount ?? 0));
  appendRow(printer, L.shiftTotal || 'Total', `${fmtMoney(report.totalAmount)} ${cur}`, true);
  appendRow(printer, L.shiftCash || 'Cash', `${fmtMoney(report.cashAmount)} ${cur}`);
  appendRow(printer, L.shiftCard || 'Card', `${fmtMoney(report.cardAmount)} ${cur}`);
  appendRow(printer, L.shiftVat || 'VAT', `${fmtMoney(report.vatAmount)} ${cur}`);
  if (Number(report.lineDiscountTotal ?? 0) > 0) {
    appendRow(printer, L.lineDiscountsSum || 'Line disc.', `${fmtMoney(report.lineDiscountTotal)} ${cur}`);
  }
  if (Number(report.orderDiscountTotal ?? 0) > 0) {
    appendRow(printer, L.orderDiscountSum || 'Order disc.', `${fmtMoney(report.orderDiscountTotal)} ${cur}`);
  }
  if (Number(report.discountTotal ?? 0) > 0) {
    appendRow(printer, L.discountsSum || 'Discount', `${fmtMoney(report.discountTotal)} ${cur}`, true);
  }

  printer.newLine();
  printer.newLine();
  printer.cut();
}

module.exports = {
  validateShiftReportPayload,
  buildShiftReportOnPrinter,
};

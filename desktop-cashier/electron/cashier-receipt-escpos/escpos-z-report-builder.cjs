/**
 * Z-отчёт (закрытый) — ESC/POS.
 */
const { fmtMoney, fmtAt } = require('./escpos-format.cjs');
const { appendRow, appendDivider, appendCenterHeader } = require('./escpos-layout.cjs');
const { sanitizePayloadForPrint, preparePrinterEncoding } = require('./escpos-encoding.cjs');

/**
 * @param {object} payload
 */
function validateZReportPayload(payload) {
  const z = payload?.z;
  if (!z || typeof z !== 'object') {
    throw new Error('Нет данных Z-отчёта');
  }
  if (z.zNumber == null && !z.closedAt) {
    throw new Error('Неполные данные Z-отчёта');
  }
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function buildZReportOnPrinter(printer, payload) {
  const safe = sanitizePayloadForPrint(payload);
  const { z, labels: L = {} } = safe;
  const cur = L.currency || 'sum';

  printer.clear();
  preparePrinterEncoding(printer);

  const brand = z.brandName || safe.branding?.appName || 'Aurent';
  const company = z.companyName || z.storeName || '—';

  appendCenterHeader(printer, [brand, (L.zReportTitle || 'Z-REPORT').toUpperCase(), company]);
  if (z.companyAddress) {
    printer.alignCenter();
    printer.println(String(z.companyAddress));
    printer.alignLeft();
  }
  appendDivider(printer);

  appendRow(printer, L.terminalSerial || 'Terminal', z.terminalSerial ?? '—');
  appendRow(printer, L.appletVer || 'Applet', z.appletVersion ?? '—');
  appendRow(printer, L.employee || 'Employee', z.employeeName ?? '—');
  appendRow(printer, L.storeName || 'Store', z.storeName ?? '—');
  appendRow(printer, L.fiscalCard || 'FM', z.fiscalCardId ?? '—');
  if (z.tin) appendRow(printer, 'TIN', z.tin);
  appendRow(printer, L.zNumber || 'Z #', String(z.zNumber ?? '—'), true);
  appendDivider(printer);

  printer.bold(true);
  printer.println(L.sectionSale || 'Sales');
  printer.bold(false);
  appendRow(printer, L.saleCash || 'Cash', `${fmtMoney(z.cashTotal)} ${cur}`);
  appendRow(printer, L.saleCard || 'Card', `${fmtMoney(z.cardTotal)} ${cur}`);
  appendRow(printer, L.saleVat || 'VAT', `${fmtMoney(z.vatAmount)} ${cur}`);
  appendRow(printer, L.saleCount || 'Count', String(z.salesCount ?? 0));
  if (Number(z.lineDiscountTotal ?? 0) > 0) {
    appendRow(printer, L.lineDiscountsSum || 'Line disc.', `${fmtMoney(z.lineDiscountTotal)} ${cur}`);
  }
  if (Number(z.orderDiscountTotal ?? 0) > 0) {
    appendRow(printer, L.orderDiscountSum || 'Order disc.', `${fmtMoney(z.orderDiscountTotal)} ${cur}`);
  }
  if (Number(z.discountTotal ?? 0) > 0) {
    appendRow(printer, L.discountsSum || 'Discount', `${fmtMoney(z.discountTotal)} ${cur}`, true);
  }
  appendDivider(printer);

  printer.bold(true);
  printer.println(L.sectionReturn || 'Returns');
  printer.bold(false);
  appendRow(printer, L.returnCash || 'Cash', `${fmtMoney(z.returnsCash)} ${cur}`);
  appendRow(printer, L.returnCard || 'Card', `${fmtMoney(z.returnsCard)} ${cur}`);
  appendRow(printer, L.returnVat || 'VAT', `${fmtMoney(z.vatReturn)} ${cur}`);
  appendRow(printer, L.returnCount || 'Count', String(z.returnsCount ?? 0));
  appendDivider(printer);

  appendRow(printer, L.openedAt || 'Opened', fmtAt(z.openedAt));
  appendRow(printer, L.closedAt || 'Closed', fmtAt(z.closedAt));
  appendRow(printer, L.firstReceipt || 'First', z.firstReceiptNumber ?? '—');
  appendRow(printer, L.lastReceipt || 'Last', z.lastReceiptNumber ?? '—');
  appendDivider(printer);

  appendRow(printer, L.grandTotal || 'TOTAL', `${fmtMoney(z.totalAmount)} ${cur}`, true);

  printer.newLine();
  printer.newLine();
  printer.cut();
}

module.exports = {
  validateZReportPayload,
  buildZReportOnPrinter,
};

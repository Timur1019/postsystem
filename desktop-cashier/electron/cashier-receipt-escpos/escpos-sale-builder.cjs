/**
 * Сборка команд чека на экземпляре ThermalPrinter.
 * Подписи полей приходят с фронта (labels), без i18n в main.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  fmtMoney,
  fmtQty,
  splitDateTime,
  buildFiscalSign,
  buildQrPayload,
  lineVatAmount,
  interpolateLabel,
  saleVatRateLabel,
} = require('./escpos-format.cjs');
const { logWarn } = require('./escpos-log.cjs');
const { sanitizePayloadForPrint, preparePrinterEncoding } = require('./escpos-encoding.cjs');

/** @param {Record<string, boolean>|undefined} fields */
function isOn(fields, key) {
  return fields?.[key] !== false;
}

/**
 * Строка «метка | значение» в две колонки.
 * @param {import('node-thermal-printer').printer} printer
 * @param {string} label
 * @param {string} value
 * @param {boolean} [bold]
 */
function appendRow(printer, label, value, bold = false) {
  if (bold) printer.bold(true);
  printer.leftRight(String(label), String(value));
  if (bold) printer.bold(false);
}

/**
 * Разделитель пунктирной линией.
 * @param {import('node-thermal-printer').printer} printer
 */
function appendDivider(printer) {
  printer.drawLine();
}

/**
 * Шапка: логотип, название, адрес, телефон, СТИР.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 * @param {string} jobId
 */
async function appendHeader(printer, payload, jobId) {
  const { sale, branding, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  const phone = String(branding?.companyPhone || '').trim();
  const stir = String(branding?.stir || '').trim();
  const showHeader =
    isOn(fields, 'logo') ||
    isOn(fields, 'companyName') ||
    (isOn(fields, 'companyAddress') && branding?.companyAddress) ||
    (isOn(fields, 'companyPhone') && phone) ||
    (isOn(fields, 'stir') && stir) ||
    phone ||
    stir;

  if (!showHeader) return;

  printer.alignCenter();

  if (isOn(fields, 'logo') && branding?.logoDataUrl) {
    try {
      const imgPath = await writeLogoTempFile(branding.logoDataUrl, jobId);
      if (imgPath) {
        await printer.printImage(imgPath);
        printer.newLine();
        try {
          fs.unlinkSync(imgPath);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      logWarn(jobId, 'LOGO_SKIP', { message: err?.message });
    }
  }

  const companyName = branding?.companyName || sale?.storeName || 'AURENT';
  if (isOn(fields, 'companyName')) {
    printer.bold(true);
    printer.println(String(companyName).toUpperCase());
    printer.bold(false);
  }
  if (isOn(fields, 'companyAddress') && branding?.companyAddress) {
    printer.println(String(branding.companyAddress));
  }
  if (phone && isOn(fields, 'companyPhone')) {
    printer.println(`${L.phoneLabel || 'Tel'}: ${phone}`);
  }
  if (stir && isOn(fields, 'stir')) {
    printer.println(`${L.stir || 'STIR'}: ${stir}`);
  }
  printer.alignLeft();
  appendDivider(printer);
}

/**
 * Сохраняет data URL логотипа во временный PNG.
 * @param {string} dataUrl
 * @param {string} jobId
 * @returns {Promise<string|null>}
 */
async function writeLogoTempFile(dataUrl, jobId) {
  const raw = String(dataUrl || '');
  const m = raw.match(/^data:image\/\w+;base64,(.+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  const filePath = path.join(os.tmpdir(), `aurent-receipt-logo-${jobId}.png`);
  fs.writeFileSync(filePath, buf);
  return filePath;
}

/**
 * Мета: дата, время, номер чека, кассир, смена.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendMeta(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};
  const hasReceiptNo = Boolean(sale.receiptNumber);
  const showMeta =
    hasReceiptNo ||
    isOn(fields, 'dateTime') ||
    isOn(fields, 'receiptNo') ||
    isOn(fields, 'employee') ||
    isOn(fields, 'shift');

  if (!showMeta) return;

  const { date, time } = splitDateTime(sale.createdAt);
  if (isOn(fields, 'dateTime')) {
    appendRow(printer, L.date || 'Date', date);
    appendRow(printer, L.time || 'Time', time);
  }
  if (hasReceiptNo) {
    appendRow(printer, L.receiptNoShort || 'Receipt', String(sale.receiptNumber));
  }
  if (isOn(fields, 'employee') && sale.cashierName) {
    appendRow(printer, L.employee || 'Cashier', sale.cashierName);
  }
  if (isOn(fields, 'shift')) {
    const shiftNo =
      brandingShift(payload) ||
      String(sale.receiptNumber || '')
        .replace(/\D/g, '')
        .slice(-3)
        .padStart(3, '0') ||
      '001';
    appendRow(printer, L.shift || 'Shift', shiftNo);
  }
  appendDivider(printer);
}

/** @param {object} payload */
function brandingShift(payload) {
  return payload.branding?.shiftNo || payload.labels?.shiftNo || '';
}

/**
 * Таблица товаров.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendItems(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'items')) return;

  printer.bold(true);
  printer.tableCustom([
    { text: L.item || 'Item', align: 'LEFT', width: 0.55 },
    { text: L.qtyShort || 'Qty', align: 'CENTER', width: 0.15 },
    { text: L.lineTotalShort || 'Sum', align: 'RIGHT', width: 0.3 },
  ]);
  printer.bold(false);

  for (const item of sale.items || []) {
    printer.tableCustom([
      { text: String(item.productName || ''), align: 'LEFT', width: 0.55 },
      { text: fmtQty(item.quantity, item.saleType), align: 'CENTER', width: 0.15 },
      { text: fmtMoney(item.lineTotal), align: 'RIGHT', width: 0.3 },
    ]);
    if (isOn(fields, 'itemIkpu') && item.ikpu) {
      printer.println(`${L.ikpuLine || 'IKPU'}: ${item.ikpu}`);
    }
    if (isOn(fields, 'itemVatLine')) {
      const rate = item.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
      const rateStr = Number.isFinite(rate) ? String(Math.round(rate)) : '12';
      const vat = lineVatAmount(item);
      const vatLabel = interpolateLabel(L.vatLineShort || 'VAT {{rate}}%', { rate: rateStr });
      printer.println(`${vatLabel}: ${fmtMoney(vat)} ${L.currency || 'sum'}`);
    }
  }
  appendDivider(printer);
}

/**
 * Скидки, итог, НДС.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendTotals(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};
  const cur = L.currency || 'sum';

  const show =
    isOn(fields, 'discounts') || isOn(fields, 'grandTotal') || isOn(fields, 'vatTotal');
  if (!show) return;

  if (isOn(fields, 'discounts') && Number(sale.lineDiscountTotal) > 0) {
    appendRow(
      printer,
      L.lineDiscountsSum || 'Line disc.',
      `${fmtMoney(sale.lineDiscountTotal)} ${cur}`,
    );
  }
  if (isOn(fields, 'discounts') && Number(sale.orderDiscountAmount) > 0) {
    appendRow(
      printer,
      L.orderDiscountSum || 'Order disc.',
      `${fmtMoney(sale.orderDiscountAmount)} ${cur}`,
    );
  }
  if (isOn(fields, 'discounts') && Number(sale.discountTotal) > 0) {
    appendRow(printer, L.discountsSum || 'Discount', `${fmtMoney(sale.discountTotal)} ${cur}`, true);
  }
  if (isOn(fields, 'grandTotal')) {
    appendRow(printer, L.grandTotal || 'TOTAL', `${fmtMoney(sale.totalAmount)} ${cur}`, true);
  }
  if (isOn(fields, 'vatTotal')) {
    const vatLabel = interpolateLabel(L.vatTotalLine || 'VAT {{rate}}%', {
      rate: saleVatRateLabel(sale),
    });
    appendRow(printer, vatLabel, `${fmtMoney(sale.taxTotal)} ${cur}`, true);
  }
  appendDivider(printer);
}

/**
 * Оплата: наличные, карта, сдача.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendPayment(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};
  const cur = L.currency || 'sum';

  if (!isOn(fields, 'payment')) return;

  const method = sale.paymentMethod;
  const total = Number(sale.totalAmount) || 0;
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

  appendRow(printer, L.paymentForm || 'Payment', `${fmtMoney(total)} ${cur}`);
  if (cashAmt > 0) {
    appendRow(printer, L.cash || 'Cash', `${fmtMoney(cashAmt)} ${cur}`);
  }
  if (cardAmt > 0) {
    appendRow(printer, L.plastic || 'Card', `${fmtMoney(cardAmt)} ${cur}`);
  }
  if (change > 0) {
    appendRow(printer, L.change || 'Change', `${fmtMoney(change)} ${cur}`, true);
  }
  appendDivider(printer);
}

/**
 * Фискальный блок.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendFiscalBlock(printer, payload) {
  const { sale, receiptFields, labels, branding } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'fiscalBlock')) return;

  printer.bold(true);
  printer.println(L.fiscalSection || 'Fiscal');
  printer.bold(false);

  const virtualRegister = branding?.virtualRegister || '1';
  const fmNumber = branding?.fmNumber || sale.receiptNumber;
  const fiscalSign = buildFiscalSign(sale);

  appendRow(printer, L.virtualRegister || 'Reg.', virtualRegister);
  appendRow(printer, L.fmNumber || 'FM', String(fmNumber));
  appendRow(printer, L.fiscalReceiptNo || 'Fiscal #', String(sale.receiptNumber));
  appendRow(printer, L.fiscalSign || 'Sign', fiscalSign);
  appendDivider(printer);
}

/**
 * QR и подвал.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendQrAndFooter(printer, payload) {
  const { sale, receiptFields, labels, branding } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'qrCode') && !isOn(fields, 'footer')) return;

  printer.alignCenter();
  if (isOn(fields, 'qrCode')) {
    const qrValue = buildQrPayload(sale, branding?.qrBase);
    if (qrValue) {
      printer.printQR(qrValue, { cellSize: 5, correction: 'M', model: 2 });
      printer.newLine();
    }
  }
  if (isOn(fields, 'footer')) {
    printer.println(L.footer || 'Thank you');
    if (L.qrHint) {
      printer.println(L.qrHint);
    }
  }
  printer.alignLeft();
}

/**
 * Заполняет printer всеми секциями чека.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 * @param {string} jobId
 */
async function buildReceiptOnPrinter(printer, payload, jobId) {
  const safePayload = sanitizePayloadForPrint(payload);
  printer.clear();
  preparePrinterEncoding(printer);
  await appendHeader(printer, safePayload, jobId);
  appendMeta(printer, safePayload);
  appendItems(printer, safePayload);
  appendTotals(printer, safePayload);
  appendPayment(printer, safePayload);
  appendFiscalBlock(printer, safePayload);
  appendQrAndFooter(printer, safePayload);
  printer.newLine();
  printer.newLine();
  printer.cut();
}

/**
 * Проверяет минимальный payload.
 * @param {object} payload
 */
function validatePayload(payload) {
  const sale = payload?.sale;
  if (!sale || typeof sale !== 'object') {
    throw new Error('Нет данных продажи (sale)');
  }
  const textLen = JSON.stringify(sale).length;
  if (!sale.receiptNumber || textLen < 40) {
    throw new Error('Неполные данные чека');
  }
}

module.exports = {
  appendHeader,
  appendMeta,
  appendItems,
  appendTotals,
  appendPayment,
  appendFiscalBlock,
  appendQrAndFooter,
  buildReceiptOnPrinter,
  validatePayload,
};

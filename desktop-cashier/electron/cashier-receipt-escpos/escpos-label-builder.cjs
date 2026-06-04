/**
 * Этикетки полки / ценники — ESC/POS на принтер этикеток.
 */
const { fmtMoney } = require('./escpos-format.cjs');
const { sanitizePayloadForPrint, preparePrinterEncoding } = require('./escpos-encoding.cjs');
const {
  barcodeOptsForPaper,
  printWrappedCenter,
} = require('./escpos-label-layout.cjs');

/**
 * @param {object} payload
 */
function validateLabelPayload(payload) {
  const items = payload?.labels;
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Нет этикеток для печати');
  }
  const needBarcode = items.some((item) => item.showBarcode);
  if (needBarcode && !items.some((item) => String(item.barcode || '').trim())) {
    throw new Error('Не указан штрихкод для печати');
  }
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} item
 * @param {object} payload
 */
function appendOneLabel(printer, item, payload) {
  const cur = item.currency || payload.labelsMeta?.currency || 'sum';
  const isPriceTag = item.variant === 'priceTag';
  const hasPrice = item.price != null && !Number.isNaN(Number(item.price));
  const paperWmm = Number(payload.paperWmm) || 40;
  const paperHmm = Number(payload.paperHmm) || 30;
  const compact = paperHmm <= 28 || paperWmm <= 35;

  printer.alignCenter();

  if (isPriceTag && item.showPrice && hasPrice) {
    printer.bold(true);
    if (!compact) {
      printer.setTextDoubleHeight();
    }
    printer.println(`${fmtMoney(item.price)} ${cur}`);
    printer.setTextNormal();
    printer.bold(false);
    if (!compact) {
      printer.newLine();
    }
  }

  if (item.showName && item.productName) {
    const maxNameLines = isPriceTag ? (compact ? 2 : 3) : 4;
    printWrappedCenter(printer, item.productName, paperWmm, maxNameLines);
    if (isPriceTag && compact) {
      printer.newLine();
    }
  }

  if (!isPriceTag && item.showPrice && hasPrice) {
    printer.bold(true);
    printer.println(`${fmtMoney(item.price)} ${cur}`);
    printer.bold(false);
    printer.newLine();
  }

  if (item.showBarcode && item.barcode) {
    const code = String(item.barcode).replace(/\s/g, '');
    if (code) {
      if (!compact) {
        printer.newLine();
      }
      const opts = barcodeOptsForPaper(paperWmm, paperHmm);
      try {
        printer.code128(code, opts);
      } catch {
        printer.println(code);
      }
    }
  }

  printer.newLine();
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function buildLabelsOnPrinter(printer, payload) {
  const safe = sanitizePayloadForPrint(payload);
  const items = safe.labels || [];
  const copies = Math.min(999, Math.max(1, Number(safe.copies) || 1));

  for (let c = 0; c < copies; c += 1) {
    for (const item of items) {
      printer.clear();
      preparePrinterEncoding(printer);
      appendOneLabel(printer, item, safe);
      printer.cut();
    }
  }
}

module.exports = {
  validateLabelPayload,
  buildLabelsOnPrinter,
};

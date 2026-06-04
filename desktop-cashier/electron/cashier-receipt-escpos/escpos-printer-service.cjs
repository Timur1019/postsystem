/**
 * Обёртка node-thermal-printer + системный драйвер принтера.
 */
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const { ESCPOS_ERROR_CODES, EscposPrintError } = require('./escpos-errors.cjs');
const { normalizeLocale, resolveCharacterSet } = require('./escpos-encoding.cjs');

const RECEIPT_WIDTH_CHARS = 48;

/** @type {object|null} */
let cachedPrinterDriver = undefined;

function loadPrinterDriver() {
  if (cachedPrinterDriver !== undefined) {
    return cachedPrinterDriver;
  }
  const candidates = ['@thiagoelg/node-printer'];
  for (const name of candidates) {
    try {
      cachedPrinterDriver = require(name);
      return cachedPrinterDriver;
    } catch {
      /* try next */
    }
  }
  cachedPrinterDriver = null;
  return null;
}

/**
 * @param {{ paperWmm?: number, kind?: 'receipt'|'label' }} options
 */
function resolvePrintWidth(options = {}) {
  if (options.width) return options.width;
  if (options.kind === 'label') {
    const mm = Number(options.paperWmm) || 58;
    if (mm <= 35) return 24;
    if (mm <= 45) return 28;
    return 32;
  }
  return RECEIPT_WIDTH_CHARS;
}

/**
 * @param {string} deviceName
 * @param {{ locale?: string, kind?: 'receipt'|'label', paperWmm?: number, width?: number, noPrinterMessage?: string, driverMissingMessage?: string }} [options]
 */
function createEscposPrinter(deviceName, options = {}) {
  const name = String(deviceName || '').trim();
  const isLabel = options.kind === 'label';
  if (!name) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.NO_PRINTER,
      options.noPrinterMessage ||
        (isLabel
          ? 'Принтер этикеток не выбран. Aurent → «Принтер штрих-кодов».'
          : 'Принтер чека не выбран. Aurent → «Принтер чека».'),
      { step: 'create_printer' },
    );
  }

  const driver = loadPrinterDriver();
  if (!driver) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.DRIVER_MISSING,
      options.driverMissingMessage ||
        'Модуль печати не найден в установке. Обновите Aurent Cashier или обратитесь в поддержку.',
      { step: 'load_driver' },
    );
  }

  const locale = normalizeLocale(options.locale);
  const characterSet = resolveCharacterSet(locale);

  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    width: resolvePrintWidth(options),
    interface: `printer:${name}`,
    characterSet,
    removeSpecialCharacters: false,
    driver,
    options: { timeout: 8000 },
  });
}

function createReceiptPrinter(deviceName, options = {}) {
  return createEscposPrinter(deviceName, { ...options, kind: 'receipt' });
}

function createLabelPrinter(deviceName, options = {}) {
  return createEscposPrinter(deviceName, {
    ...options,
    kind: 'label',
    paperWmm: options.paperWmm,
  });
}

async function checkConnected(printer) {
  try {
    return await printer.isPrinterConnected();
  } catch {
    return false;
  }
}

async function executePrint(printer) {
  try {
    const ok = await printer.execute();
    if (!ok) {
      throw new Error('execute() вернул false');
    }
  } catch (err) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.EXECUTE_FAILED,
      err?.message || 'Печать на принтере не выполнена',
      { step: 'execute', cause: err instanceof Error ? err : undefined },
    );
  }
}

module.exports = {
  RECEIPT_WIDTH_CHARS,
  loadPrinterDriver,
  createEscposPrinter,
  createReceiptPrinter,
  createLabelPrinter,
  resolvePrintWidth,
  checkConnected,
  executePrint,
};

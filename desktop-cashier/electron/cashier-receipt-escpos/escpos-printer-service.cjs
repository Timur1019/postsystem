/**
 * Обёртка node-thermal-printer + системный драйвер принтера.
 * Не смешивать с print-thermal.cjs (этикетки через webContents.print).
 */
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const { ESCPOS_ERROR_CODES, EscposPrintError } = require('./escpos-errors.cjs');
const { normalizeLocale, resolveCharacterSet } = require('./escpos-encoding.cjs');

const RECEIPT_WIDTH_CHARS = 48;

/** @type {object|null} */
let cachedPrinterDriver = undefined;

/**
 * Загружает native-драйвер (optionalDependency).
 * @returns {object|null}
 */
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
 * Создаёт экземпляр ThermalPrinter для имени Windows/macOS принтера.
 * @param {string} deviceName — точное имя из настроек Aurent
 * @param {{ locale?: string }} [options] — ru | uz с фронта (i18n)
 * @returns {import('node-thermal-printer').printer}
 */
function createReceiptPrinter(deviceName, options = {}) {
  const name = String(deviceName || '').trim();
  if (!name) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.NO_PRINTER,
      'Принтер чека не выбран. Aurent → «Принтер чека».',
      { step: 'create_printer' },
    );
  }

  const driver = loadPrinterDriver();
  if (!driver) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.DRIVER_MISSING,
      'Модуль печати чека не найден в установке. Обновите Aurent Cashier (установщик с /install) или обратитесь в поддержку.',
      { step: 'load_driver' },
    );
  }

  const locale = normalizeLocale(options.locale);
  const characterSet = resolveCharacterSet(locale);

  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    width: RECEIPT_WIDTH_CHARS,
    interface: `printer:${name}`,
    characterSet,
    removeSpecialCharacters: false,
    driver,
    options: { timeout: 8000 },
  });
}

/**
 * Проверяет доступность принтера перед печатью.
 * @param {import('node-thermal-printer').printer} printer
 * @returns {Promise<boolean>}
 */
async function checkConnected(printer) {
  try {
    return await printer.isPrinterConnected();
  } catch {
    return false;
  }
}

/**
 * Отправляет буфер ESC/POS на принтер.
 * @param {import('node-thermal-printer').printer} printer
 * @returns {Promise<void>}
 */
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
  createReceiptPrinter,
  checkConnected,
  executePrint,
};

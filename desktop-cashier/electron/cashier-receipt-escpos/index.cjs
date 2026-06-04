/**
 * ESC/POS: чеки, Z/X-отчёты, этикетки (main process).
 */
const { ESCPOS_ERROR_CODES, EscposPrintError } = require('./escpos-errors.cjs');
const { runEscposPrintJob } = require('./escpos-job.cjs');
const { validatePayload, buildReceiptOnPrinter } = require('./escpos-sale-builder.cjs');
const { validateZReportPayload, buildZReportOnPrinter } = require('./escpos-z-report-builder.cjs');
const {
  validateShiftReportPayload,
  buildShiftReportOnPrinter,
} = require('./escpos-shift-report-builder.cjs');
const { validateLabelPayload, buildLabelsOnPrinter } = require('./escpos-label-builder.cjs');
const { createReceiptPrinter, createLabelPrinter } = require('./escpos-printer-service.cjs');

function wrapEscposError(err) {
  if (err instanceof EscposPrintError) {
    const e = new Error(err.message);
    e.code = err.code;
    e.step = err.step;
    throw e;
  }
  throw err;
}

async function printSaleReceiptEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'sale_receipt',
      payload,
      resolvePrinterName: deps.resolveReceiptPrinterName,
      validatePayload,
      createPrinter: (deviceName, p) => createReceiptPrinter(deviceName, { locale: p.locale }),
      buildOnPrinter: (printer, p, jobId) => buildReceiptOnPrinter(printer, p, jobId),
      noPrinterHint: 'Принтер чека не настроен. Aurent → «Принтер чека».',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

async function printZReportEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'z_report',
      payload,
      resolvePrinterName: deps.resolveReceiptPrinterName,
      validatePayload: validateZReportPayload,
      createPrinter: (deviceName, p) => createReceiptPrinter(deviceName, { locale: p.locale }),
      buildOnPrinter: (printer, p) => buildZReportOnPrinter(printer, p),
      noPrinterHint: 'Принтер чека не настроен. Aurent → «Принтер чека».',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

async function printShiftReportEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'shift_report',
      payload,
      resolvePrinterName: deps.resolveReceiptPrinterName,
      validatePayload: validateShiftReportPayload,
      createPrinter: (deviceName, p) => createReceiptPrinter(deviceName, { locale: p.locale }),
      buildOnPrinter: (printer, p) => buildShiftReportOnPrinter(printer, p),
      noPrinterHint: 'Принтер чека не настроен. Aurent → «Принтер чека».',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

async function printLabelsEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'label',
      payload,
      resolvePrinterName: deps.resolveLabelPrinterName,
      validatePayload: validateLabelPayload,
      createPrinter: (deviceName, p) =>
        createLabelPrinter(deviceName, { locale: p.locale, paperWmm: p.paperWmm }),
      buildOnPrinter: (printer, p) => buildLabelsOnPrinter(printer, p),
      noPrinterHint:
        'Принтер этикеток не выбран. Aurent → «Принтер штрих-кодов» — выберите устройство.',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

function registerEscposIpcHandler(ipcMain, channel, handler) {
  ipcMain.handle(channel, async (_event, payload) => {
    try {
      return await handler(payload);
    } catch (err) {
      wrapEscposError(err);
    }
  });
}

/**
 * @param {import('electron').IpcMain} ipcMain
 * @param {{ resolveReceiptPrinterName: Function, resolveLabelPrinterName: Function }} deps
 */
function registerEscposIpcHandlers(ipcMain, deps) {
  registerEscposIpcHandler(ipcMain, 'desktop:print-receipt-escpos', (payload) =>
    printSaleReceiptEscpos(payload, deps),
  );
  registerEscposIpcHandler(ipcMain, 'desktop:print-z-report-escpos', (payload) =>
    printZReportEscpos(payload, deps),
  );
  registerEscposIpcHandler(ipcMain, 'desktop:print-shift-report-escpos', (payload) =>
    printShiftReportEscpos(payload, deps),
  );
  registerEscposIpcHandler(ipcMain, 'desktop:print-label-escpos', (payload) =>
    printLabelsEscpos(payload, deps),
  );
}

module.exports = {
  printSaleReceiptEscpos,
  printZReportEscpos,
  printShiftReportEscpos,
  printLabelsEscpos,
  registerEscposIpcHandlers,
  EscposPrintError,
  ESCPOS_ERROR_CODES,
};

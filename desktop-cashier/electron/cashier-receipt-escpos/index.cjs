/**
 * Автопечать фискального чека после продажи (ESC/POS, main process).
 * IPC: desktop:print-receipt-escpos
 */
const { ESCPOS_ERROR_CODES, EscposPrintError } = require('./escpos-errors.cjs');
const { createJobId, logStep, logError } = require('./escpos-log.cjs');
const { validatePayload, buildReceiptOnPrinter } = require('./escpos-sale-builder.cjs');
const {
  createReceiptPrinter,
  checkConnected,
  executePrint,
} = require('./escpos-printer-service.cjs');

/**
 * Печать одного чека по payload с фронта.
 * @param {object} payload — sale, branding, receiptFields, labels
 * @param {{ resolveReceiptPrinterName: Function }} deps
 * @returns {Promise<{ ok: true, jobId: string, deviceName: string }>}
 */
async function printSaleReceiptEscpos(payload, deps) {
  const jobId = createJobId();
  logStep(jobId, 'start');

  try {
    validatePayload(payload);
  } catch (err) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.INVALID_PAYLOAD,
      err?.message || 'Некорректные данные чека',
      { step: 'validate', cause: err instanceof Error ? err : undefined },
    );
  }

  let deviceName = '';
  try {
    logStep(jobId, 'resolve_printer');
    deviceName = await deps.resolveReceiptPrinterName({ promptIfMissing: false });
    if (!String(deviceName).trim()) {
      throw new EscposPrintError(
        ESCPOS_ERROR_CODES.NO_PRINTER,
        'Принтер чека не настроен. Aurent → «Принтер чека».',
        { step: 'resolve_printer' },
      );
    }
    logStep(jobId, 'resolve_printer_ok', { deviceName });
  } catch (err) {
    if (err instanceof EscposPrintError) throw err;
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.NO_PRINTER,
      err?.message || 'Не удалось выбрать принтер чека',
      { step: 'resolve_printer', cause: err instanceof Error ? err : undefined },
    );
  }

  let printer;
  try {
    logStep(jobId, 'create_printer');
    printer = createReceiptPrinter(deviceName);
  } catch (err) {
    logError(jobId, 'create_printer', err);
    throw err;
  }

  try {
    logStep(jobId, 'build_buffer');
    await buildReceiptOnPrinter(printer, payload, jobId);
    logStep(jobId, 'build_buffer_ok', { textLen: printer.getText?.()?.length });
  } catch (err) {
    logError(jobId, 'build_buffer', err);
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.BUILD_FAILED,
      err?.message || 'Не удалось сформировать чек',
      { step: 'build_buffer', cause: err instanceof Error ? err : undefined },
    );
  }

  try {
    logStep(jobId, 'is_connected');
    const connected = await checkConnected(printer);
    if (!connected) {
      throw new EscposPrintError(
        ESCPOS_ERROR_CODES.NOT_CONNECTED,
        `Принтер «${deviceName}» недоступен. Проверьте USB/драйвер и имя в Aurent.`,
        { step: 'is_connected' },
      );
    }
    logStep(jobId, 'execute');
    await executePrint(printer);
    logStep(jobId, 'done', { deviceName });
    return { ok: true, jobId, deviceName, mode: 'escpos' };
  } catch (err) {
    logError(jobId, 'execute', err);
    if (err instanceof EscposPrintError) throw err;
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.EXECUTE_FAILED,
      err?.message || 'Печать не выполнена',
      { step: 'execute', cause: err instanceof Error ? err : undefined },
    );
  }
}

/**
 * Регистрирует IPC handler desktop:print-receipt-escpos.
 * @param {import('electron').IpcMain} ipcMain
 * @param {{ resolveReceiptPrinterName: Function }} deps
 */
function registerEscposIpcHandlers(ipcMain, deps) {
  ipcMain.handle('desktop:print-receipt-escpos', async (_event, payload) => {
    try {
      return await printSaleReceiptEscpos(payload, deps);
    } catch (err) {
      if (err instanceof EscposPrintError) {
        const e = new Error(err.message);
        e.code = err.code;
        e.step = err.step;
        throw e;
      }
      throw err;
    }
  });
}

module.exports = {
  printSaleReceiptEscpos,
  registerEscposIpcHandlers,
  EscposPrintError,
  ESCPOS_ERROR_CODES,
};

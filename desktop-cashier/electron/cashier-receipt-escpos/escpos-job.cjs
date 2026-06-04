/**
 * Общий раннер ESC/POS задания (чек, отчёт, этикетка).
 */
const { ESCPOS_ERROR_CODES, EscposPrintError } = require('./escpos-errors.cjs');
const { createJobId, logStep, logError, logWarn } = require('./escpos-log.cjs');
const { checkConnected, executePrint } = require('./escpos-printer-service.cjs');

/**
 * @param {object} opts
 * @param {string} opts.jobType
 * @param {object} opts.payload
 * @param {Function} opts.resolvePrinterName
 * @param {Function} opts.createPrinter
 * @param {Function} opts.validatePayload
 * @param {Function} opts.buildOnPrinter
 * @param {string} opts.noPrinterHint
 */
async function runEscposPrintJob(opts) {
  const jobId = createJobId();
  const jobType = opts.jobType || 'print';
  logStep(jobId, 'start', { jobType });

  try {
    opts.validatePayload(opts.payload);
  } catch (err) {
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.INVALID_PAYLOAD,
      err?.message || 'Некорректные данные для печати',
      { step: 'validate', cause: err instanceof Error ? err : undefined },
    );
  }

  let deviceName = '';
  try {
    logStep(jobId, 'resolve_printer');
    deviceName = await opts.resolvePrinterName({ promptIfMissing: false });
    if (!String(deviceName).trim()) {
      throw new EscposPrintError(
        ESCPOS_ERROR_CODES.NO_PRINTER,
        opts.noPrinterHint || 'Принтер не настроен.',
        { step: 'resolve_printer' },
      );
    }
    logStep(jobId, 'resolve_printer_ok', { deviceName });
  } catch (err) {
    if (err instanceof EscposPrintError) throw err;
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.NO_PRINTER,
      err?.message || 'Не удалось выбрать принтер',
      { step: 'resolve_printer', cause: err instanceof Error ? err : undefined },
    );
  }

  let printer;
  try {
    logStep(jobId, 'create_printer', { locale: opts.payload?.locale || 'ru' });
    printer = opts.createPrinter(deviceName, opts.payload);
  } catch (err) {
    logError(jobId, 'create_printer', err);
    throw err;
  }

  try {
    logStep(jobId, 'build_buffer');
    await opts.buildOnPrinter(printer, opts.payload, jobId);
    logStep(jobId, 'build_buffer_ok');
  } catch (err) {
    logError(jobId, 'build_buffer', err);
    throw new EscposPrintError(
      ESCPOS_ERROR_CODES.BUILD_FAILED,
      err?.message || 'Не удалось сформировать задание печати',
      { step: 'build_buffer', cause: err instanceof Error ? err : undefined },
    );
  }

  try {
    logStep(jobId, 'is_connected');
    const connected = await checkConnected(printer);
    if (!connected) {
      if (process.platform === 'win32') {
        logWarn(jobId, 'is_connected_false_win_try_anyway', { deviceName });
      } else {
        throw new EscposPrintError(
          ESCPOS_ERROR_CODES.NOT_CONNECTED,
          `Принтер «${deviceName}» недоступен.`,
          { step: 'is_connected' },
        );
      }
    }
    logStep(jobId, 'execute');
    await executePrint(printer);
    logStep(jobId, 'done', { deviceName, jobType });
    return { ok: true, jobId, deviceName, mode: 'escpos', jobType };
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

module.exports = {
  runEscposPrintJob,
};

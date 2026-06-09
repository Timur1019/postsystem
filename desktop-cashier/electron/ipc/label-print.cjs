const { ipcMain } = require('electron');
const { readPrinterSettings } = require('../core/config.cjs');
const { matchPrinterName } = require('../printers/printer-match.cjs');
const {
  waitForLabelImages,
  waitForPaintFrames,
  runSilentLabelPrint,
  MEASURE_LABEL_DIMS_JS,
} = require('../printers/print-thermal.cjs');
const {
  listSystemPrinters,
  resolveLabelPrinterName,
} = require('../printers/resolve.cjs');

async function safeExecuteJavaScript(wc, script, stepLabel) {
  try {
    return await wc.executeJavaScript(script);
  } catch (err) {
    const detail = err?.message || String(err);
    if (/Script failed to execute/i.test(detail)) {
      throw new Error(`Сбой подготовки печати (${stepLabel}). Повторите операцию.`);
    }
    throw err;
  }
}

const LABEL_READY_JS = `
  (() => {
    document.documentElement.classList.add('shelflabel-layout-measure');
    try {
      const layer = document.getElementById('shelf-label-print-layer');
      if (!layer) return false;
      const pages = layer.querySelectorAll('.shelflabel-print-page');
      if (!pages.length) return false;
      const page = pages[0];
      const h = Math.max(
        page.offsetHeight || 0,
        page.scrollHeight || 0,
        page.getBoundingClientRect().height || 0,
        layer.scrollHeight || 0
      );
      const paperHmm = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--label-paper-h-mm')
      ) || 0;
      if (h < 8 && paperHmm < 15) return false;
      const svgs = layer.querySelectorAll('.shelflabel-barcode-svg');
      if (!svgs.length) return true;
      return [...svgs].every((s) => s.querySelector('rect, path, line, g, text'));
    } finally {
      document.documentElement.classList.remove('shelflabel-layout-measure');
    }
  })()
`;

async function waitLabelReadyForPrint(wc, attempts = 45) {
  for (let i = 0; i < attempts; i += 1) {
    const ready = await safeExecuteJavaScript(wc, LABEL_READY_JS, 'этикетка');
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 120 + i * 100));
  }
  return false;
}

function registerLabelPrintIpc() {
  ipcMain.handle('print-label-page', async (event, opts) => {
    const wc = event.sender;
    if (!wc || wc.isDestroyed()) {
      throw new Error('Окно печати недоступно');
    }
    const copies = Math.min(999, Math.max(1, Math.trunc(Number(opts?.copies) || 1)));
    const ready = await waitLabelReadyForPrint(wc);
    if (!ready) {
      throw new Error('Этикетка не готова для печати (штрихкод или макет)');
    }
    await waitForLabelImages(wc);
    await waitForPaintFrames(wc);
    await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 400 : 250));
    const dims = await safeExecuteJavaScript(wc, MEASURE_LABEL_DIMS_JS, 'размер этикетки');
    if (!dims?.pageHmm || dims.pageCount !== 1) {
      throw new Error('Этикетка пустая для печати');
    }
    const printers = await listSystemPrinters();
    const savedLabel = readPrinterSettings().labelPrinterName || '';
    const deviceName =
      matchPrinterName(savedLabel, printers) ||
      (await resolveLabelPrinterName({ promptIfMissing: false }));
    if (!String(deviceName || '').trim()) {
      throw new Error(
        'Принтер этикеток не выбран. Меню Aurent → «Принтер штрих-кодов» — укажите устройство из списка Windows.',
      );
    }
    await runSilentLabelPrint(wc, { deviceName, printers, dims, copies });
    return { ok: true, deviceName, copies };
  });
}

module.exports = { registerLabelPrintIpc };

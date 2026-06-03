const { BrowserWindow } = require('electron');
const { buildReceiptDocumentFromSale } = require('./receipt-html-builder.cjs');
const {
  waitForPaintFrames,
  runSilentReceiptAutoPrint,
} = require('./print-thermal.cjs');

const MEASURE_CLEAN_RECEIPT_DIMS_JS = `
(() => {
  const area = document.getElementById('receipt-print-area') || document.querySelector('.receipt-print-root');
  if (!area) return null;
  const textLen = (area.innerText || '').trim().length;
  const contentPx = Math.max(
    area.scrollHeight,
    area.offsetHeight,
    area.getBoundingClientRect().height,
    120,
  );
  if (textLen < 80 || contentPx < 120) return null;
  const paperMm = 80;
  const pxPerMm = 96 / 25.4;
  const heightMm = Math.max(120, Math.ceil(contentPx / pxPerMm) + 24);
  return { paperMm, heightMm, textLen, contentPx };
})()
`;

const WAIT_CLEAN_DOC_IMAGES_JS = `
(() => {
  const imgs = Array.from(document.images);
  return Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((r) => {
              img.onload = r;
              img.onerror = r;
            }),
    ),
  );
})()
`;

function normalizeBranding(branding = {}) {
  return {
    companyName: branding.companyName || branding.receiptCompanyName || '',
    companyAddress: branding.companyAddress || branding.receiptCompanyAddress || '',
    stir: branding.stir || branding.receiptStir || '',
    logoDataUrl: branding.logoDataUrl || branding.receiptLogoDataUrl || null,
  };
}

/**
 * Тихая печать в отдельном скрытом окне с белым HTML (без React/Tailwind кассы).
 * @param {{ sale: object, branding?: object }} payload
 * @param {{ resolveReceiptPrinterName: Function, listSystemPrinters: Function }} deps
 */
async function printReceiptInCleanWindow(payload, deps) {
  const sale = payload?.sale;
  if (!sale || typeof sale !== 'object') {
    throw new Error('Нет данных чека для печати');
  }

  const branding = normalizeBranding(payload.branding);
  const html = buildReceiptDocumentFromSale(sale, branding);

  const printWin = new BrowserWindow({
    show: false,
    width: 420,
    height: 960,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  try {
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await printWin.loadURL(dataUrl);

    const wc = printWin.webContents;
    await wc.executeJavaScript(WAIT_CLEAN_DOC_IMAGES_JS);
    await waitForPaintFrames(wc);
    await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 200 : 120));

    const dims = await wc.executeJavaScript(MEASURE_CLEAN_RECEIPT_DIMS_JS);
    if (!dims?.textLen || dims.textLen < 80) {
      throw new Error('Чек пустой для автопечати');
    }

    const deviceName = await deps.resolveReceiptPrinterName({ promptIfMissing: false });
    const printers = await deps.listSystemPrinters();
    await waitForPaintFrames(wc);

    const result = await runSilentReceiptAutoPrint(wc, {
      deviceName,
      printers,
      dims,
      cleanDocument: true,
    });
    return { ok: true, ...result, mode: 'clean-window' };
  } finally {
    if (!printWin.isDestroyed()) {
      printWin.close();
    }
  }
}

module.exports = {
  printReceiptInCleanWindow,
  MEASURE_CLEAN_RECEIPT_DIMS_JS,
};

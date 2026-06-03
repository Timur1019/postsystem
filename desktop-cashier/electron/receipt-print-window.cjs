const { BrowserWindow } = require('electron');
const {
  buildReceiptDocumentFromSale,
  buildThermalReceiptDocument,
} = require('./receipt-html-builder.cjs');
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

const STRIP_RECEIPT_PRINT_FILLS_JS = `
(() => {
  for (const el of document.querySelectorAll('*')) {
    if (!(el instanceof HTMLElement)) continue;
    const tag = el.tagName;
    if (tag === 'IMG' || tag === 'SVG' || tag === 'CANVAS') continue;
    el.style.setProperty('background', 'transparent', 'important');
    el.style.setProperty('background-color', 'transparent', 'important');
    el.style.setProperty('box-shadow', 'none', 'important');
    el.style.setProperty('color', '#000000', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
  }
  document.documentElement.style.setProperty('background', 'transparent', 'important');
  document.body.style.setProperty('background', 'transparent', 'important');
  return true;
})()
`;

/**
 * Тихая печать в отдельном скрытом окне (HTML чека из кассы, без UI).
 * @param {{ sale?: object, branding?: object, bodyHtml?: string }} payload
 */
async function printReceiptInCleanWindow(payload, deps) {
  const sale = payload?.sale;
  const bodyHtml = String(payload?.bodyHtml || '').trim();
  const branding = normalizeBranding(payload.branding);

  let html;
  if (bodyHtml.length > 80) {
    html = buildThermalReceiptDocument(bodyHtml);
  } else if (sale && typeof sale === 'object') {
    html = buildReceiptDocumentFromSale(sale, branding);
  } else {
    throw new Error('Нет данных чека для печати');
  }

  const printWin = new BrowserWindow({
    show: false,
    width: 320,
    height: 1200,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preferredColorScheme: 'light',
    },
  });

  try {
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await printWin.loadURL(dataUrl);

    const wc = printWin.webContents;
    await wc.executeJavaScript(WAIT_CLEAN_DOC_IMAGES_JS);
    await wc.executeJavaScript(STRIP_RECEIPT_PRINT_FILLS_JS);
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

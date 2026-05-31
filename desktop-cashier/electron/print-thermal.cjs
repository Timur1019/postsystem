/**
 * Electron: тихая печать (webContents.print silent).
 * Автопечать чека после продажи + этикетки. Ручной чек — window.print() на фронте.
 */

const IS_WIN = process.platform === 'win32';

const PRINT_CALLBACK_TIMEOUT_MS = IS_WIN ? 12000 : 8000;

function paperWidthPx(paperMm) {
  return Math.max(280, Math.round((paperMm / 25.4) * 96) + 48);
}

function invokeWebContentsPrint(webContents, opts, timeoutMs = PRINT_CALLBACK_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    if (!webContents || webContents.isDestroyed()) {
      reject(new Error('Окно печати недоступно'));
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn('[Aurent print] webContents.print — таймаут callback, очередь принтера');
      resolve({ callbackTimeout: true, success: true });
    }, timeoutMs);

    try {
      webContents.print(opts, (success, failureReason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (success) {
          resolve({ success: true });
          return;
        }
        const detail =
          failureReason && failureReason !== 'cancelled' ? failureReason : 'Печать не выполнена';
        reject(new Error(detail));
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}

function waitForImages(webContents) {
  return webContents.executeJavaScript(`
    Promise.all(
      Array.from(document.images).map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((r) => {
                img.onload = r;
                img.onerror = r;
              })
      )
    )
  `);
}

function waitForPaintFrames(webContents) {
  return webContents.executeJavaScript(`
    new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    })
  `);
}

function buildStandardSilentPrintOpts(deviceName) {
  const opts = {
    silent: true,
    printBackground: true,
    margins: { marginType: 'none' },
    copies: 1,
  };
  const name = String(deviceName || '').trim();
  if (name) {
    opts.deviceName = name;
    opts.usePrinterDefaultPageSize = true;
  }
  return opts;
}

function buildSizedSilentPrintOpts(deviceName, dims) {
  const opts = buildStandardSilentPrintOpts(deviceName);
  const paperMm = dims?.paperMm || 80;
  const heightMm = Math.max(dims?.heightMm || 200, 120);
  opts.pageSize = {
    width: Math.round(paperMm * 1000),
    height: Math.round(heightMm * 1000),
  };
  delete opts.usePrinterDefaultPageSize;
  return opts;
}

function winPrintAttempts(requestedName, printers, platformIsWin = IS_WIN) {
  const requested = String(requestedName || '').trim();
  if (!platformIsWin) {
    return requested ? [requested] : [''];
  }
  const info = printers?.find((p) => p.name === requested);
  const attempts = [];
  if (requested) {
    attempts.push(requested);
  }
  if (!requested || !info?.isDefault) {
    attempts.push('');
  }
  return [...new Set(attempts)];
}

const MEASURE_RECEIPT_DIMS_JS = `
(() => {
  const roots = ['#pos-sale-print-shell', '#fiscal-print-shell'];
  for (const sel of roots) {
    const root = document.querySelector(sel);
    if (!root) continue;
    const area = root.querySelector('#receipt-print-area') || root.querySelector('.receipt-print-root') || root;
    const textLen = (area.innerText || '').trim().length;
    const contentPx = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
    if (textLen < 40 || contentPx < 80) continue;
    const paperRaw = getComputedStyle(document.documentElement).getPropertyValue('--print-paper-w-mm').trim();
    const paperMm = parseFloat(paperRaw) || 80;
    const pxPerMm = 96 / 25.4;
    const heightMm = Math.max(120, Math.ceil(contentPx / pxPerMm) + 24);
    return { paperMm, heightMm, textLen, contentPx };
  }
  return null;
})()
`;

/**
 * Тихая автопечать: классы print-* на <html>, чек уже на экране (превью POS).
 */
async function runSilentReceiptAutoPrint(webContents, options = {}) {
  const deviceName = options.deviceName ? String(options.deviceName) : '';
  const printers = options.printers || [];
  const dims = options.dims || null;
  const attempts = winPrintAttempts(deviceName, printers);
  const printerLabel = deviceName || 'принтер по умолчанию';

  const strategies = [buildStandardSilentPrintOpts];
  if (dims?.heightMm && IS_WIN) {
    strategies.push((name) => buildSizedSilentPrintOpts(name, dims));
  }

  let lastErr;
  for (const name of attempts) {
    for (const buildOpts of strategies) {
      try {
        const opts = buildOpts(name);
        const result = await invokeWebContentsPrint(webContents, opts);
        if (result.callbackTimeout) {
          console.warn('[Aurent print] auto receipt — задание в очереди Windows');
        }
        return { mode: 'silent', deviceName: name || deviceName || '' };
      } catch (err) {
        lastErr = err;
      }
    }
  }
  const detail = lastErr?.message || 'Печать не выполнена';
  throw new Error(
    `${detail} (принтер: ${printerLabel}). ` +
      'Aurent → «Принтер чека»: выберите POS-80 и сохраните.'
  );
}

function runSilentLabelPrint(webContents, options = {}) {
  const deviceName = options.deviceName ? String(options.deviceName) : '';
  const opts = {
    silent: true,
    printBackground: true,
    margins: { marginType: 'none' },
  };
  if (deviceName) {
    opts.deviceName = deviceName;
  }
  const printerLabel = deviceName || 'принтер по умолчанию';
  return invokeWebContentsPrint(webContents, opts)
    .then(() => ({ deviceName: deviceName || null }))
    .catch((err) => {
      const detail = err?.message || 'Печать не выполнена';
      throw new Error(
        `${detail} (принтер: ${printerLabel}). ` +
          'Aurent → «Принтер этикеток»: выберите устройство из списка Windows.'
      );
    });
}

module.exports = {
  IS_WIN,
  paperWidthPx,
  waitForImages,
  waitForPaintFrames,
  runSilentReceiptAutoPrint,
  runSilentLabelPrint,
  buildStandardSilentPrintOpts,
  winPrintAttempts,
  MEASURE_RECEIPT_DIMS_JS,
};

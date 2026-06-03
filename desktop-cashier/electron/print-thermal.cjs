/**
 * Electron: тихая печать этикеток (webContents.print silent).
 * Фискальный чек — window.print() на фронте.
 */

const IS_WIN = process.platform === 'win32';

const PRINT_CALLBACK_TIMEOUT_MS = IS_WIN ? 12000 : 8000;

function paperWidthPx(paperMm) {
  return Math.max(280, Math.round((paperMm / 25.4) * 96) + 48);
}

function invokeWebContentsPrint(
  webContents,
  opts,
  timeoutMs = PRINT_CALLBACK_TIMEOUT_MS,
  { acceptCallbackTimeout = false } = {}
) {
  return new Promise((resolve, reject) => {
    if (!webContents || webContents.isDestroyed()) {
      reject(new Error('Окно печати недоступно'));
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn('[Aurent print] webContents.print — таймаут callback');
      if (acceptCallbackTimeout) {
        resolve({ callbackTimeout: true, success: true });
        return;
      }
      reject(
        new Error(
          'Принтер не ответил — задание не попало в очередь. Проверьте имя принтера в меню Aurent.'
        )
      );
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

function waitForLabelImages(webContents) {
  return webContents.executeJavaScript(`
    (() => {
      const layer = document.getElementById('shelf-label-print-layer');
      const imgs = layer
        ? Array.from(layer.querySelectorAll('img'))
        : [];
      return Promise.all(
        imgs.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((r) => {
                  img.onload = r;
                  img.onerror = r;
                })
        )
      );
    })()
  `);
}

function waitForPaintFrames(webContents) {
  return webContents.executeJavaScript(`
    new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    })
  `);
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

const LABEL_PRINT_TIMEOUT_MS = IS_WIN ? 20000 : 12000;

const MEASURE_LABEL_DIMS_JS = `
(() => {
  const layer = document.getElementById('shelf-label-print-layer');
  if (!layer) return null;
  const pages = layer.querySelectorAll('.shelflabel-print-page');
  const pageCount = pages.length || 0;
  if (pageCount < 1) return null;
  const parseMm = (raw, fallback) => {
    const n = parseFloat(String(raw || '').trim());
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const root = document.documentElement;
  const widthMm = parseMm(root.style.getPropertyValue('--label-paper-w-mm'), 58);
  const pageHmm = parseMm(root.style.getPropertyValue('--label-paper-h-mm'), 40);
  const gapMm = parseMm(root.style.getPropertyValue('--label-gap-mm'), 0);
  const heightMm = pageHmm * pageCount + gapMm * Math.max(0, pageCount - 1);
  if (heightMm < 15) return null;
  return { widthMm, pageHmm, heightMm, pageCount, gapMm };
})()
`;

function buildLabelSilentPrintOpts(deviceName, dims) {
  const opts = {
    silent: true,
    printBackground: true,
    margins: { marginType: 'none' },
    copies: 1,
  };
  const name = String(deviceName || '').trim();
  if (name) {
    opts.deviceName = name;
  }
  const widthMm = dims?.widthMm || 58;
  const pageHmm = dims?.pageHmm || dims?.heightMm || 40;
  const pageCount = Math.max(1, Number(dims?.pageCount) || 1);
  const gapMm = Number(dims?.gapMm) || 0;
  const heightMm =
    dims?.heightMm && dims.heightMm > 0
      ? dims.heightMm
      : pageHmm * pageCount + gapMm * Math.max(0, pageCount - 1);
  opts.pageSize = {
    width: Math.round(widthMm * 1000),
    height: Math.round(Math.max(heightMm, pageHmm) * 1000),
  };
  return opts;
}

async function runSilentLabelPrint(webContents, options = {}) {
  const deviceName = options.deviceName ? String(options.deviceName) : '';
  const printers = options.printers || [];
  const dims = options.dims || null;
  const printerLabel = deviceName || 'не выбран';

  if (!String(deviceName).trim()) {
    throw new Error(
      'Принтер этикеток не настроен. Aurent → «Принтер штрих-кодов» — выберите устройство из списка Windows.'
    );
  }

  const attempts = winPrintAttempts(deviceName, printers);
  let lastErr;

  for (const name of attempts) {
    const opts = buildLabelSilentPrintOpts(name, dims);
    try {
      const result = await invokeWebContentsPrint(
        webContents,
        opts,
        LABEL_PRINT_TIMEOUT_MS,
        { acceptCallbackTimeout: false }
      );
      if (result.callbackTimeout) {
        throw new Error('Принтер не подтвердил печать этикетки');
      }
      return { deviceName: name || deviceName };
    } catch (err) {
      lastErr = err;
      console.warn('[Aurent print] label attempt failed:', name || '(default)', err?.message);
    }
  }

  const detail = lastErr?.message || 'Печать не выполнена';
  throw new Error(
    `${detail} (принтер: ${printerLabel}). ` +
      'Aurent → «Принтер штрих-кодов»: выберите термопринтер этикеток.'
  );
}

module.exports = {
  IS_WIN,
  paperWidthPx,
  waitForLabelImages,
  waitForPaintFrames,
  runSilentLabelPrint,
  winPrintAttempts,
  MEASURE_LABEL_DIMS_JS,
  buildLabelSilentPrintOpts,
};

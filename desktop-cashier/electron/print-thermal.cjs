/**
 * Electron: тихая печать этикеток через webContents.print.
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

/** Жёстко одна страница: убираем лишние .shelflabel-print-page и фиксируем высоту. */
const LOCK_SINGLE_LABEL_PAGE_JS = `
(() => {
  const layer = document.getElementById('shelf-label-print-layer');
  if (!layer) return null;
  const pages = [...layer.querySelectorAll('.shelflabel-print-page')];
  pages.slice(1).forEach((node) => node.remove());
  const page = layer.querySelector('.shelflabel-print-page');
  if (!page) return null;

  const parseMm = (raw, fallback) => {
    const n = parseFloat(String(raw || '').trim());
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const root = document.documentElement;
  const widthMm = parseMm(root.style.getPropertyValue('--label-paper-w-mm'), 58);
  const pageHmm = parseMm(root.style.getPropertyValue('--label-paper-h-mm'), 40);
  const styleId = 'pos-label-single-page-lock';
  document.getElementById(styleId)?.remove();
  const el = document.createElement('style');
  el.id = styleId;
  el.textContent = [
    '@page { size: ' + widthMm + 'mm ' + pageHmm + 'mm; margin: 0 !important; }',
    'html, body {',
    '  width: ' + widthMm + 'mm !important;',
    '  height: ' + pageHmm + 'mm !important;',
    '  max-width: ' + widthMm + 'mm !important;',
    '  max-height: ' + pageHmm + 'mm !important;',
    '  overflow: hidden !important;',
    '  margin: 0 !important;',
    '  padding: 0 !important;',
    '}',
    '#pos-label-print-mount, #shelf-label-print-layer {',
    '  width: ' + widthMm + 'mm !important;',
    '  height: ' + pageHmm + 'mm !important;',
    '  max-width: ' + widthMm + 'mm !important;',
    '  max-height: ' + pageHmm + 'mm !important;',
    '  overflow: hidden !important;',
    '  margin: 0 !important;',
    '  padding: 0 !important;',
    '}',
    '.shelflabel-print-page {',
    '  page-break-before: avoid !important;',
    '  page-break-after: avoid !important;',
    '  break-before: avoid !important;',
    '  break-after: avoid !important;',
    '}',
  ].join('\\n');
  document.head.appendChild(el);

  return { widthMm, pageHmm, heightMm: pageHmm, pageCount: 1, gapMm: 0 };
})()
`;

const MEASURE_LABEL_DIMS_JS = LOCK_SINGLE_LABEL_PAGE_JS;

function buildLabelSilentPrintOpts(deviceName, dims) {
  const opts = {
    silent: true,
    printBackground: true,
    margins: { marginType: 'none' },
    copies: 1,
    pageRanges: '1',
    preferCSSPageSize: true,
    landscape: false,
  };
  const name = String(deviceName || '').trim();
  if (name) {
    opts.deviceName = name;
  }
  const widthMm = dims?.widthMm || 58;
  const pageHmm = dims?.pageHmm || dims?.heightMm || 40;
  opts.pageSize = {
    width: Math.round(widthMm * 1000),
    height: Math.round(pageHmm * 1000),
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

  const requested = String(deviceName || '').trim();
  const attempts = requested ? [requested] : winPrintAttempts(deviceName, printers);
  let lastErr;

  for (const name of attempts) {
    const opts = buildLabelSilentPrintOpts(name, dims);
    try {
      const result = await invokeWebContentsPrint(
        webContents,
        opts,
        LABEL_PRINT_TIMEOUT_MS,
        { acceptCallbackTimeout: true }
      );
      if (result.callbackTimeout) {
        console.warn('[Aurent print] label: callback timeout — считаем печать отправленной');
      }
      return { deviceName: name || deviceName, callbackTimeout: Boolean(result.callbackTimeout) };
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
  LOCK_SINGLE_LABEL_PAGE_JS,
  buildLabelSilentPrintOpts,
};

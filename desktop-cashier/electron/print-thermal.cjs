/**
 * Electron: тихая печать (webContents.print silent).
 * Автопечать чека после продажи + этикетки. Ручной чек — window.print() на фронте.
 */

const IS_WIN = process.platform === 'win32';

const PRINT_CALLBACK_TIMEOUT_MS = IS_WIN ? 12000 : 8000;

/** Находит чек автопечати на body, не внутри #root. */
const FIND_FISCAL_PRINT_SHELL_JS = `
  document.querySelector('#pos-auto-print-print-host-capture #fiscal-print-shell')
    || document.querySelector('#pos-auto-print-handbook-print-slot #fiscal-print-shell')
    || document.querySelector('#pos-auto-print-handbook-print-area #fiscal-print-shell')
    || document.querySelector('#pos-auto-print-print-host #fiscal-print-shell')
    || Array.from(document.querySelectorAll('#fiscal-print-shell')).find(
      (el) => !document.getElementById('root')?.contains(el)
    )
    || document.getElementById('fiscal-print-shell')
`;

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

function waitForImages(webContents) {
  return webContents.executeJavaScript(`
    (() => {
      const shell = ${FIND_FISCAL_PRINT_SHELL_JS.trim()};
      const imgs = shell
        ? Array.from(shell.querySelectorAll('img'))
        : Array.from(document.images);
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

/** Светлый capture off-screen. #root не трогаем — иначе чёрный экран кассы. */
const FORCE_RECEIPT_LIGHT_PRINT_JS = `
(() => {
  const host = document.getElementById('pos-auto-print-print-host-capture');
  const shell = host?.querySelector('#fiscal-print-shell');
  if (!host || !shell) return false;

  host.style.setProperty('left', '-10000px', 'important');
  host.style.setProperty('top', '0', 'important');
  host.style.setProperty('opacity', '1', 'important');
  host.style.setProperty('visibility', 'visible', 'important');
  host.style.setProperty('background-color', '#ffffff', 'important');

  const nodes = [host, shell, ...shell.querySelectorAll('*')];
  for (const el of nodes) {
    if (!(el instanceof HTMLElement)) continue;
    el.style.setProperty('background-color', '#ffffff', 'important');
    el.style.setProperty('color', '#000000', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('filter', 'none', 'important');
    el.style.setProperty('mix-blend-mode', 'normal', 'important');
  }
  return true;
})()
`;

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
  const shell = ${FIND_FISCAL_PRINT_SHELL_JS.trim()};
  if (!shell) return null;
  const area = shell.querySelector('#receipt-print-area') || shell.querySelector('.receipt-print-root') || shell;
  const textLen = (area.innerText || '').trim().length;
  const contentPx = Math.max(
    area.scrollHeight,
    area.offsetHeight,
    area.getBoundingClientRect().height,
    shell.scrollHeight,
  );
  if (textLen < 80 || contentPx < 120) return null;
  const paperRaw = getComputedStyle(document.documentElement).getPropertyValue('--print-paper-w-mm').trim();
  const paperMm = parseFloat(paperRaw) || 80;
  const pxPerMm = 96 / 25.4;
  const heightMm = Math.max(120, Math.ceil(contentPx / pxPerMm) + 24);
  return { paperMm, heightMm, textLen, contentPx };
})()
`;

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

const AUTO_PRINT_TIMEOUT_MS = IS_WIN ? 8000 : 6000;
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

/**
 * Тихая автопечать: сначала драйвер 80mm, при сбое — с высотой по контенту.
 */
async function runSilentReceiptAutoPrint(webContents, options = {}) {
  const deviceName = options.deviceName ? String(options.deviceName) : '';
  const printers = options.printers || [];
  const dims = options.dims || null;
  const attempts = winPrintAttempts(deviceName, printers);
  const printerLabel = deviceName || 'принтер по умолчанию';
  const name = attempts[0] ?? deviceName;

  const tryPrint = async (opts) => {
    await webContents.executeJavaScript(FORCE_RECEIPT_LIGHT_PRINT_JS);
    await waitForPaintFrames(webContents);
    return invokeWebContentsPrint(webContents, opts, AUTO_PRINT_TIMEOUT_MS);
  };

  try {
    const result = await tryPrint(buildStandardSilentPrintOpts(name));
    if (result.callbackTimeout) {
      throw new Error(
        'Принтер не подтвердил печать чека — проверьте очередь и Aurent → «Принтер чека».'
      );
    }
    return { mode: 'silent', deviceName: name || deviceName || '' };
  } catch (firstErr) {
    if (!dims?.heightMm || !IS_WIN) throw firstErr;
    try {
      await tryPrint(buildSizedSilentPrintOpts(name, dims));
      return { mode: 'silent', deviceName: name || deviceName || '' };
    } catch {
      const detail = firstErr?.message || 'Печать не выполнена';
      throw new Error(
        `${detail} (принтер: ${printerLabel}). ` +
          'Aurent → «Принтер чека»: выберите POS-80 и сохраните.'
      );
    }
  }
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
  waitForImages,
  waitForLabelImages,
  waitForPaintFrames,
  FORCE_RECEIPT_LIGHT_PRINT_JS,
  runSilentReceiptAutoPrint,
  runSilentLabelPrint,
  buildStandardSilentPrintOpts,
  winPrintAttempts,
  MEASURE_RECEIPT_DIMS_JS,
  MEASURE_LABEL_DIMS_JS,
  buildLabelSilentPrintOpts,
};

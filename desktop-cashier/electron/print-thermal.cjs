/**
 * Тихая печать термочека (Electron).
 * На Windows скрытое окно (show:false) часто даёт пустой лист — нужен show + ready-to-show.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { BrowserWindow } = require('electron');
const { buildThermalReceiptDocument } = require('./receipt-html-builder.cjs');

const IS_WIN = process.platform === 'win32';

/** Запас внизу листа — драйвер POS-80 чаще отрезает после подачи бумаги. */
const CUT_FEED_MM = 22;

/** Таймаут всей операции печати — иначе окно чека «висит» на экране. */
const PRINT_JOB_TIMEOUT_MS = 45000;

/** Windows POS-80: callback webContents.print иногда не вызывается — не ждём вечно. */
const PRINT_CALLBACK_TIMEOUT_MS = IS_WIN ? 12000 : 8000;

/** Диалог печати: пользователь нажимает «Печать» вручную. */
const PRINT_DIALOG_CALLBACK_TIMEOUT_MS = 120000;

/**
 * webContents.print с таймаутом (известная проблема Electron + термопринтеры Windows).
 * По таймауту считаем задание отправленным в очередь Windows.
 */
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

/** Окно за пределами экрана: на Windows нужен show для отрисовки, но не показываем пользователю. */
const OFFSCREEN_BOUNDS = { x: -24000, y: -24000 };

function paperWidthPx(paperMm) {
  return Math.max(280, Math.round((paperMm / 25.4) * 96) + 48);
}

/** Синхронизация CSS-переменных из localStorage (отдельное окно печати). */
const SYNC_PRINT_VARS_JS = `
(() => {
  try {
    const raw = localStorage.getItem('pos-print-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      const s = parsed.state || parsed;
      const root = document.documentElement;
      const paper = Number(s.paperWidthMm) || 80;
      const content = Number(s.contentWidthMm) || 72;
      root.style.setProperty('--print-paper-w-mm', String(paper));
      root.style.setProperty('--print-paper-w', paper + 'mm');
      root.style.setProperty('--print-content-w', content + 'mm');
      root.style.setProperty('--print-page-margin-mm', (Number(s.pageMarginMm) ?? 0) + 'mm');
      root.style.setProperty('--print-pad-x', (Number(s.padHorizontalMm) ?? 3) + 'mm');
      root.style.setProperty('--print-pad-y', (Number(s.padVerticalMm) ?? 2) + 'mm');
      root.style.setProperty('--print-font-px', (Number(s.fontSizePx) || 13) + 'px');
      root.style.setProperty('--print-line-height', String(Number(s.lineHeight) || 1.5));
    }
    const td = localStorage.getItem('pos-tenant-display');
    if (td) {
      const st = (JSON.parse(td).state) || JSON.parse(td);
      const mm = Number(st.receiptLogoMaxHeightMm) || 32;
      document.documentElement.style.setProperty('--print-logo-max-h', mm + 'mm');
    }
  } catch (e) {
    console.warn('[Aurent print] sync vars', e);
  }
})()
`;

function waitForPaintFrames(webContents) {
  return webContents.executeJavaScript(`
    new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    })
  `);
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

/**
 * Дождаться отрисовки (критично для Windows при show:false).
 */
function waitForWindowReady(win, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    if (win.isDestroyed()) {
      reject(new Error('Окно печати закрыто'));
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new Error('Таймаут подготовки окна печати'));
      }
    }, timeoutMs);

    win.once('ready-to-show', finish);
    win.webContents.once('did-finish-load', () => {
      setTimeout(finish, IS_WIN ? 400 : 200);
    });
    if (!win.webContents.isLoading()) {
      setTimeout(finish, IS_WIN ? 500 : 250);
    }
  });
}

function cleanupThermalPrintInPage(webContents) {
  if (!webContents || webContents.isDestroyed()) {
    return Promise.resolve();
  }
  return webContents
    .executeJavaScript(`
    (() => {
      ['print-thermal-only', 'electron-silent-print', 'print-thermal-modal'].forEach((c) => {
        document.documentElement.classList.remove(c);
      });
      document.getElementById('pos-print-job-page')?.remove();
    })()
  `)
    .catch(() => {});
}

function prepareThermalPrintInPage(webContents, extraClasses = []) {
  const classes = ['print-thermal-only', 'electron-silent-print', ...extraClasses];
  const classList = classes.map((c) => `'${c}'`).join(', ');
  return webContents.executeJavaScript(`
    (async () => {
      ${SYNC_PRINT_VARS_JS}
      const add = [${classList}];
      add.forEach((c) => document.documentElement.classList.add(c));
      const paper = getComputedStyle(document.documentElement).getPropertyValue('--print-paper-w-mm').trim() || '80';
      const margin = getComputedStyle(document.documentElement).getPropertyValue('--print-page-margin-mm').trim() || '0';
      let el = document.getElementById('pos-print-job-page');
      if (!el) {
        el = document.createElement('style');
        el.id = 'pos-print-job-page';
        document.head.appendChild(el);
      }
      el.textContent = '@page { size: ' + paper + 'mm auto; margin: ' + margin + '; }';
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const measure = () => {
        const area =
          document.getElementById('receipt-print-area') ||
          document.getElementById('fiscal-print-shell');
        const h = area
          ? Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height)
          : 0;
        const textLen = area ? (area.innerText || '').trim().length : 0;
        return { h, textLen, area };
      };
      let best = measure();
      for (let i = 0; i < 8; i += 1) {
        await new Promise((r) => setTimeout(r, 150));
        const next = measure();
        if (next.h > best.h || next.textLen > best.textLen) {
          best = next;
        }
      }
      const pxPerMm = 96 / 25.4;
      const bodyH = document.body.scrollHeight || 0;
      const contentPx = Math.max(best.h, bodyH, best.area ? best.area.scrollHeight : 0);
      const heightMm = Math.max(100, Math.ceil(contentPx / pxPerMm) + 20 + ${CUT_FEED_MM});
      return {
        paperMm: parseFloat(paper) || 80,
        heightMm,
        contentHeightPx: contentPx,
        textLen: best.textLen,
      };
    })()
  `);
}

function buildSilentPrintOpts(deviceName, dims, useCustomPageSize = true) {
  const paperMm = dims?.paperMm || 80;
  const heightMm = dims?.heightMm || 200;
  const opts = {
    silent: true,
    printBackground: true,
    margins: { marginType: 'none' },
    copies: 1,
  };
  if (deviceName) {
    opts.deviceName = deviceName;
  }
  if (useCustomPageSize) {
    const pageH = Math.round(Math.max(heightMm, 100) * 1000);
    const pageW = Math.round(paperMm * 1000);
    opts.pageSize = { width: pageW, height: pageH };
  }
  return opts;
}

/**
 * Параметры по документации Electron webContents.print:
 * silent: true, printBackground: false, deviceName, margins: none.
 * Размер 80 mm — в свойствах принтера Windows.
 */
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
  }
  return opts;
}

/** Тихая печать чека — webContents.print({ silent: true }) как в документации Electron. */
async function runStandardSilentReceiptPrint(webContents, deviceName, printers) {
  const attempts = winPrintAttempts(deviceName, printers);
  const printerLabel = String(deviceName || '').trim() || 'принтер по умолчанию';
  let lastErr;
  for (const name of attempts) {
    try {
      const opts = buildStandardSilentPrintOpts(name);
      const result = await invokeWebContentsPrint(webContents, opts);
      if (result.callbackTimeout) {
        console.warn('[Aurent print] silent — задание в очереди Windows');
      }
      return { mode: 'silent', deviceName: name || deviceName || '' };
    } catch (err) {
      lastErr = err;
    }
  }
  const detail = lastErr?.message || 'Печать не выполнена';
  throw new Error(
    `${detail} (принтер: ${printerLabel}). ` +
      'Проверьте POS-80 в Windows и меню Aurent → «Принтер чека».'
  );
}

/** Windows: очередь «по умолчанию» иногда печатает, когда явное имя (POS-80) даёт Print job failed. */
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
  /** Если принтер не default — повтор через очередь Windows по умолчанию. */
  if (!requested || !info?.isDefault) {
    attempts.push('');
  }
  return [...new Set(attempts)];
}

function runSilentPrint(webContents, dims, options = {}) {
  const requested = options.deviceName ? String(options.deviceName) : '';
  const printers = options.printers || [];
  const attempts = winPrintAttempts(requested, printers);
  const printerLabel = requested || 'принтер по умолчанию';
  /** POS-80: сначала без pageSize (драйвер), затем с явной высотой. */
  const pageSizeStrategies = IS_WIN ? [false, true] : [true];

  const tryOnce = async (name, useCustomPageSize) => {
    const opts = buildSilentPrintOpts(name, dims, useCustomPageSize);
    const result = await invokeWebContentsPrint(webContents, opts);
    if (result.callbackTimeout) {
      console.warn('[Aurent print] silent — задание в очереди без callback');
    }
    return { deviceName: name || requested || null, useCustomPageSize };
  };

  return (async () => {
    let lastErr;
    for (const name of attempts) {
      for (const useCustomPageSize of pageSizeStrategies) {
        try {
          return await tryOnce(name, useCustomPageSize);
        } catch (err) {
          lastErr = err;
        }
      }
    }
    const detail = lastErr?.message || 'Печать не выполнена';
    throw new Error(
      `${detail} (принтер: ${printerLabel}). ` +
        'Проверьте: POS-80 включён, рулон 80 мм, в Windows тестовая страница печатается. ' +
        'В Aurent снова выберите «Принтер чека» → POS-80 → Сохранить.'
    );
  })();
}

function runDialogReceiptPrint(webContents, deviceName) {
  const opts = {
    silent: false,
    printBackground: true,
    margins: { marginType: 'none' },
    copies: 1,
  };
  if (deviceName) {
    opts.deviceName = deviceName;
  }
  return new Promise((resolve, reject) => {
    invokeWebContentsPrint(webContents, opts, PRINT_DIALOG_CALLBACK_TIMEOUT_MS)
      .then(() => resolve({ dialog: true }))
      .catch(reject);
  });
}

async function verifyReceiptPdf(webContents, dims) {
  try {
    const pdf = await buildReceiptPdfBuffer(webContents, dims);
    return Boolean(pdf && pdf.length > 6000);
  } catch {
    return false;
  }
}

async function buildReceiptPdfBuffer(webContents, dims) {
  const paperMm = dims?.paperMm || 80;
  const heightMm = Math.max(dims?.heightMm || 200, 100);
  return webContents.printToPDF({
    printBackground: true,
    margins: { marginType: 'none' },
    pageSize: {
      width: Math.round(paperMm * 1000),
      height: Math.round(heightMm * 1000),
    },
  });
}

async function runSilentPdfReceiptPrint(pdfBuffer, deviceName, printers) {
  if (!pdfBuffer || pdfBuffer.length < 6000) {
    throw new Error('PDF чека пустой');
  }
  let printPdf;
  try {
    printPdf = require('pdf-to-printer').print;
  } catch (err) {
    throw new Error(`pdf-to-printer недоступен: ${err?.message || err}`);
  }
  const tmpPdf = path.join(os.tmpdir(), `aurent-receipt-${Date.now()}.pdf`);
  fs.writeFileSync(tmpPdf, pdfBuffer);
  try {
    const attempts = winPrintAttempts(deviceName, printers);
    let lastErr;
    for (const name of attempts) {
      try {
        const opts = {
          silent: true,
          printDialog: false,
          scale: 'shrink',
          monochrome: true,
        };
        if (name) {
          opts.printer = name;
        }
        await printPdf(tmpPdf, opts);
        return { deviceName: name || deviceName || null };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('PDF печать не выполнена');
  } finally {
    fs.unlink(tmpPdf, () => {});
  }
}

/**
 * Перед печатью: на Windows окно должно быть отрисовано; диалог — поверх fullscreen.
 */
function preparePrintWindowForJob(mainWindow, printWin, widthPx, heightPx, useDialog) {
  if (useDialog && mainWindow && !mainWindow.isDestroyed() && mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
  }
  showWindowForPrint(printWin, widthPx, heightPx, { visible: useDialog });
  if (useDialog && printWin && !printWin.isDestroyed()) {
    printWin.focus();
    printWin.moveTop();
  }
}

/** Windows: только HTML silent → диалог (без PDF). */
async function runWindowsReceiptPrint(
  printWin,
  webContents,
  dims,
  deviceName,
  printers,
  options = {}
) {
  const widthPx = paperWidthPx(dims?.paperMm || 80);
  const heightPx = Math.min(5000, Math.max(400, Math.ceil((dims?.contentHeightPx || 900) + 80)));
  const mainWindow = options.mainWindow || null;
  const forceDialog = Boolean(options.useDialog);

  const openDialog = async () => {
    preparePrintWindowForJob(mainWindow, printWin, widthPx, heightPx, true);
    await waitForPaintFrames(webContents);
    await new Promise((r) => setTimeout(r, IS_WIN ? 500 : 150));
    await runDialogReceiptPrint(webContents, deviceName);
    return { mode: 'dialog' };
  };

  if (forceDialog) {
    return openDialog();
  }

  preparePrintWindowForJob(mainWindow, printWin, widthPx, heightPx, false);
  await waitForPaintFrames(webContents);
  await new Promise((r) => setTimeout(r, IS_WIN ? 500 : 150));

  try {
    const result = await runStandardSilentReceiptPrint(webContents, deviceName, printers);
    await new Promise((r) => setTimeout(r, 400));
    return { mode: 'silent', deviceName: result.deviceName };
  } catch (standardErr) {
    console.warn('[Aurent print] standard silent failed:', standardErr?.message || standardErr);
  }

  try {
    await runSilentPrint(webContents, dims, { deviceName, printers });
    await new Promise((r) => setTimeout(r, 400));
    return { mode: 'silent' };
  } catch (silentErr) {
    console.warn('[Aurent print] silent HTML failed:', silentErr?.message || silentErr);
  }

  return openDialog();
}

async function loadReceiptHtmlInWindow(printWin, bodyHtml) {
  const fullDoc = buildThermalReceiptDocument(bodyHtml);
  if (IS_WIN) {
    const tmpPath = path.join(
      os.tmpdir(),
      `aurent-receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.html`
    );
    fs.writeFileSync(tmpPath, fullDoc, 'utf8');
    try {
      await printWin.loadFile(tmpPath);
    } finally {
      fs.unlink(tmpPath, () => {});
    }
    return;
  }
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullDoc)}`;
  await printWin.loadURL(dataUrl);
}

function runSilentReceiptPrint(webContents, options = {}) {
  const requested = options.deviceName ? String(options.deviceName) : '';
  const printers = options.printers || [];
  const dims = options.dims || null;
  if (dims) {
    return runSilentPrint(webContents, dims, { deviceName: requested, printers });
  }
  const attempts = winPrintAttempts(requested, printers);
  const printerLabel = requested || 'принтер по умолчанию';

  const tryOnce = async (name) => {
    const opts = {
      silent: true,
      printBackground: true,
      margins: { marginType: 'none' },
      copies: 1,
    };
    if (name) {
      opts.deviceName = name;
    }
    await invokeWebContentsPrint(webContents, opts);
    return { deviceName: name || requested || null };
  };

  return (async () => {
    let lastErr;
    for (const name of attempts) {
      try {
        return await tryOnce(name);
      } catch (err) {
        lastErr = err;
      }
    }
    const detail = lastErr?.message || 'Печать не выполнена';
    throw new Error(`${detail} (принтер: ${printerLabel}).`);
  })();
}

/**
 * Подготовить окно к печати. visible:false — за экраном (автопечать), иначе превью на POS.
 */
function showWindowForPrint(win, widthPx, heightPx, options = {}) {
  if (!win || win.isDestroyed()) return;
  const visible = options.visible !== false;
  const height = Math.min(heightPx, 1200);
  if (IS_WIN) {
    const bounds = visible
      ? { x: 60, y: 60, width: widthPx, height }
      : { ...OFFSCREEN_BOUNDS, width: widthPx, height };
    win.setBounds(bounds);
    win.setOpacity(1);
  } else if (!visible) {
    win.setPosition(OFFSCREEN_BOUNDS.x, OFFSCREEN_BOUNDS.y);
  }
  if (!win.isVisible()) {
    win.showInactive();
  }
}

function forceClosePrintWindow(win) {
  if (win && !win.isDestroyed()) {
    try {
      win.close();
    } catch {
      /* ignore */
    }
  }
}

function defaultReceiptDims(bodyHtml, options = {}) {
  const plainLen = String(bodyHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
  const isShift = options.kind === 'shift';
  const baseMm = isShift ? Math.ceil(plainLen / 3.2) + 28 : Math.ceil(plainLen / 2.5) + 40;
  const heightMm = Math.min(isShift ? 320 : 600, Math.max(isShift ? 90 : 180, baseMm + CUT_FEED_MM));
  return {
    paperMm: 80,
    heightMm,
    contentHeightPx: Math.ceil((heightMm - CUT_FEED_MM) * (96 / 25.4)),
    textLen: plainLen,
  };
}

async function printHtmlInHiddenWindow(bodyHtml, options = {}) {
  const paperMm = 80;
  const widthPx = paperWidthPx(paperMm);
  const deviceName = options.deviceName || '';
  const printers = options.printers || [];
  const useDialog = Boolean(options.useDialog);
  const standaloneReceipt = Boolean(options.standaloneReceipt);
  const mainWindow = options.mainWindow || null;
  const printWin = createReceiptPrintWindow({
    width: widthPx,
    height: 1600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      ...(options.session ? { session: options.session } : {}),
    },
  });
  printWin.webContents.setZoomFactor(1);

  const killTimer = setTimeout(() => {
    console.warn('[Aurent print] timeout — закрываем окно печати');
    forceClosePrintWindow(printWin);
  }, PRINT_JOB_TIMEOUT_MS);

  try {
    await loadReceiptHtmlInWindow(printWin, bodyHtml);
    await ensureWindowPainted(printWin, { visible: false });
    await waitForImages(printWin.webContents);
    await new Promise((r) => setTimeout(r, IS_WIN ? 800 : 300));
    await waitForPaintFrames(printWin.webContents);

    let dims;
    if (standaloneReceipt) {
      dims = defaultReceiptDims(bodyHtml, { kind: options.contentKind || 'receipt' });
    } else {
      dims = await prepareThermalPrintInPage(printWin.webContents);
      if (!dims?.textLen || dims.textLen < 40 || dims.contentHeightPx < 80) {
        dims = defaultReceiptDims(bodyHtml);
      }
    }

    const heightPx = Math.min(5000, Math.max(400, Math.ceil(dims.contentHeightPx + 80)));
    printWin.setSize(widthPx, heightPx);

    if (IS_WIN) {
      return runWindowsReceiptPrint(printWin, printWin.webContents, dims, deviceName, printers, {
        useDialog,
        mainWindow,
      });
    }

    preparePrintWindowForJob(mainWindow, printWin, widthPx, heightPx, useDialog);
    await waitForPaintFrames(printWin.webContents);
    await new Promise((r) => setTimeout(r, 200));

    if (useDialog) {
      await runDialogReceiptPrint(printWin.webContents, deviceName);
      return { mode: 'dialog' };
    }

    await runSilentPrint(printWin.webContents, dims, { deviceName, printers });
    await new Promise((r) => setTimeout(r, 150));
    return { mode: 'silent' };
  } finally {
    clearTimeout(killTimer);
    await cleanupThermalPrintInPage(printWin.webContents);
    forceClosePrintWindow(printWin);
  }
}

/**
 * @param {import('electron').BrowserWindowConstructorOptions & { webPreferences: object }} base
 */
function createReceiptPrintWindow({ width, height, webPreferences }) {
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    frame: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    paintWhenInitiallyHidden: true,
    webPreferences,
  });

  if (IS_WIN) {
    win.setPosition(OFFSCREEN_BOUNDS.x, OFFSCREEN_BOUNDS.y);
    win.setOpacity(1);
  }

  return win;
}

async function ensureWindowPainted(win, options = {}) {
  const visible = options.visible === true;
  if (!win.isDestroyed()) {
    if (IS_WIN && !visible) {
      const [w, h] = win.getSize();
      showWindowForPrint(win, w || paperWidthPx(80), h || 800, { visible: false });
    } else if (IS_WIN) {
      win.showInactive();
    }
  }
  await waitForWindowReady(win);
  await waitForPaintFrames(win.webContents);
}

/**
 * Печать этикетки/штрих-кода: размер бумаги отдаём драйверу (термоэтикетка, A4 и т.д.).
 * Указывать pageSize не безопасно — у этикеточных принтеров своя физическая ширина.
 */
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
          'Aurent → «Принтер чека»: выберите устройство из списка Windows.'
      );
    });
}

module.exports = {
  IS_WIN,
  paperWidthPx,
  waitForWindowReady,
  waitForPaintFrames,
  waitForImages,
  prepareThermalPrintInPage,
  cleanupThermalPrintInPage,
  runSilentPrint,
  runSilentReceiptPrint,
  runDialogReceiptPrint,
  runSilentLabelPrint,
  buildThermalReceiptDocument,
  printHtmlInHiddenWindow,
  loadReceiptHtmlInWindow,
  verifyReceiptPdf,
  buildReceiptPdfBuffer,
  runSilentPdfReceiptPrint,
  runWindowsReceiptPrint,
  preparePrintWindowForJob,
  defaultReceiptDims,
  showWindowForPrint,
  forceClosePrintWindow,
  PRINT_JOB_TIMEOUT_MS,
  createReceiptPrintWindow,
  ensureWindowPainted,
  runStandardSilentReceiptPrint,
  buildStandardSilentPrintOpts,
  /** @internal unit tests */
  buildSilentPrintOpts,
  winPrintAttempts,
};

/**
 * Тихая печать термочека (Electron).
 * На Windows скрытое окно (show:false) часто даёт пустой лист — нужен show + ready-to-show.
 */

const { BrowserWindow } = require('electron');
const { buildThermalReceiptDocument } = require('./receipt-html-builder.cjs');

const IS_WIN = process.platform === 'win32';

/** Запас внизу листа — драйвер POS-80 чаще отрезает после подачи бумаги. */
const CUT_FEED_MM = 22;

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
      const heightMm = Math.max(100, Math.ceil(contentPx / pxPerMm) + 20 + CUT_FEED_MM);
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
  /** POS-80 на Windows часто печатает пустую полоску с кастомным pageSize — сначала драйвер по умолчанию. */
  const pageSizeStrategies = IS_WIN ? [false, true] : [true];

  const tryOnce = (name, useCustomPageSize) =>
    new Promise((resolve, reject) => {
      const opts = buildSilentPrintOpts(name, dims, useCustomPageSize);
      webContents.print(opts, (success, failureReason) => {
        if (success) {
          resolve({ deviceName: name || requested || null, useCustomPageSize });
          return;
        }
        const detail =
          failureReason && failureReason !== 'cancelled' ? failureReason : 'Печать не выполнена';
        reject(new Error(detail));
      });
    });

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

function runSilentReceiptPrint(webContents, options = {}) {
  const requested = options.deviceName ? String(options.deviceName) : '';
  const printers = options.printers || [];
  const attempts = winPrintAttempts(requested, printers);
  const printerLabel = requested || 'принтер по умолчанию';

  const tryOnce = (name) =>
    new Promise((resolve, reject) => {
      const opts = {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' },
        copies: 1,
      };
      if (name) {
        opts.deviceName = name;
      }
      webContents.print(opts, (success, failureReason) => {
        if (success) {
          resolve({ deviceName: name || requested || null });
          return;
        }
        const detail =
          failureReason && failureReason !== 'cancelled' ? failureReason : 'Печать не выполнена';
        reject(new Error(detail));
      });
    });

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

function showWindowForPrint(win, widthPx, heightPx) {
  if (!win || win.isDestroyed()) return;
  if (IS_WIN) {
    win.setBounds({ x: 60, y: 60, width: widthPx, height: Math.min(heightPx, 1200) });
    win.setOpacity(1);
  }
  win.showInactive();
}

async function printHtmlInHiddenWindow(bodyHtml, options = {}) {
  const paperMm = 80;
  const widthPx = paperWidthPx(paperMm);
  const deviceName = options.deviceName || '';
  const printers = options.printers || [];
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
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(buildThermalReceiptDocument(bodyHtml))}`;

  try {
    await printWin.loadURL(dataUrl);
    await ensureWindowPainted(printWin);
    await waitForImages(printWin.webContents);
    await new Promise((r) => setTimeout(r, IS_WIN ? 600 : 250));
    await waitForPaintFrames(printWin.webContents);
    const dims = await prepareThermalPrintInPage(printWin.webContents);
    if (!dims?.textLen || dims.textLen < 80 || dims.contentHeightPx < 120) {
      throw new Error('Чек пустой — не удалось подготовить печать');
    }
    const heightPx = Math.min(5000, Math.max(900, Math.ceil(dims.contentHeightPx * 1.2)));
    showWindowForPrint(printWin, widthPx, heightPx);
    await waitForPaintFrames(printWin.webContents);
    await new Promise((r) => setTimeout(r, IS_WIN ? 500 : 150));
    await runSilentReceiptPrint(printWin.webContents, { deviceName, printers });
    await new Promise((r) => setTimeout(r, IS_WIN ? 500 : 150));
  } finally {
    await cleanupThermalPrintInPage(printWin.webContents);
    if (!printWin.isDestroyed()) {
      printWin.close();
    }
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
    win.setPosition(-3200, 0);
    win.setOpacity(0.01);
  }

  return win;
}

async function ensureWindowPainted(win) {
  if (IS_WIN && !win.isDestroyed()) {
    win.showInactive();
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
  return new Promise((resolve, reject) => {
    webContents.print(opts, (success, failureReason) => {
      if (success) {
        resolve({ deviceName: deviceName || null });
        return;
      }
      const detail = failureReason && failureReason !== 'cancelled' ? failureReason : 'Печать не выполнена';
      reject(
        new Error(
          `${detail} (принтер: ${printerLabel}). ` +
            'Aurent → «Принтер чека»: выберите устройство из списка Windows.'
        )
      );
    });
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
  runSilentLabelPrint,
  buildThermalReceiptDocument,
  printHtmlInHiddenWindow,
  showWindowForPrint,
  createReceiptPrintWindow,
  ensureWindowPainted,
  /** @internal unit tests */
  buildSilentPrintOpts,
  winPrintAttempts,
};

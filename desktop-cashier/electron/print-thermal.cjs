/**
 * Тихая печать термочека (Electron).
 * На Windows скрытое окно (show:false) часто даёт пустой лист — нужен show + ready-to-show.
 */

const { BrowserWindow } = require('electron');

const IS_WIN = process.platform === 'win32';

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
      const area =
        document.getElementById('receipt-print-area') ||
        document.getElementById('fiscal-print-shell');
      const h = area ? Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height) : 0;
      const textLen = area ? (area.innerText || '').trim().length : 0;
      const pxPerMm = 96 / 25.4;
      const heightMm = Math.max(60, Math.ceil((Math.max(h, document.body.scrollHeight) / pxPerMm)) + 10);
      return {
        paperMm: parseFloat(paper) || 80,
        heightMm,
        contentHeightPx: h,
        textLen,
      };
    })()
  `);
}

function runSilentPrint(webContents, dims) {
  const paperMm = dims?.paperMm || 80;
  const heightMm = dims?.heightMm || 200;
  const opts = {
    silent: true,
    printBackground: true,
    margins: { marginType: 'none' },
  };
  // На Windows произвольный pageSize у 80мм принтеров часто даёт пустую ленту.
  if (!IS_WIN) {
    opts.pageSize = {
      width: Math.round(paperMm * 1000),
      height: Math.round(heightMm * 1000),
    };
  }

  return new Promise((resolve, reject) => {
    webContents.print(opts, (success, failureReason) => {
      if (success) resolve();
      else reject(new Error(failureReason || 'Печать отменена'));
    });
  });
}

/**
 * Окно для печати чека по URL (?silent=1).
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

module.exports = {
  IS_WIN,
  paperWidthPx,
  waitForWindowReady,
  waitForPaintFrames,
  waitForImages,
  prepareThermalPrintInPage,
  runSilentPrint,
  createReceiptPrintWindow,
  ensureWindowPainted,
};

/**
 * Electron: тихая печать этикеток (webContents.print).
 * Чеки и X/Z — window.print() в рендерере (как в браузере), см. web-frontend printReceipt.js.
 */

const IS_WIN = process.platform === 'win32';

/** Windows: callback webContents.print иногда не вызывается — не ждём вечно. */
const PRINT_CALLBACK_TIMEOUT_MS = IS_WIN ? 12000 : 8000;

function paperWidthPx(paperMm) {
  return Math.max(280, Math.round((paperMm / 25.4) * 96) + 48);
}

/**
 * webContents.print с таймаутом (Electron + термопринтеры Windows).
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
 * Печать этикетки/штрих-кода: размер бумаги — в драйвере принтера.
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
          'Aurent → «Принтер этикеток»: выберите устройство из списка Windows.'
      );
    });
}

module.exports = {
  IS_WIN,
  paperWidthPx,
  waitForImages,
  runSilentLabelPrint,
};

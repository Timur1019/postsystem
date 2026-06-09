const { app, ipcMain } = require('electron');
const { loadConfig, readPrinterSettings, writePrinterSettings } = require('../core/config.cjs');
const { registerScaleIpc } = require('../scales/index.cjs');
const { registerLabelTsplIpc } = require('../label-tspl/index.cjs');
const { registerOfflineIpc } = require('../offline/ipc.cjs');
const { probeBackendOnlineQuick } = require('../connectivity/probe.cjs');
const { showPrinterPickerWindow } = require('../printers/picker-window.cjs');
const { checkForUpdatesNow } = require('../updates/auto-update.cjs');
const {
  resolveReceiptPrinterName,
  resolveLabelPrinterName,
} = require('../printers/resolve.cjs');
const { reloadCashierPage, openServerSettings } = require('../window/cashier-session.cjs');
const state = require('../bootstrap/state.cjs');

function registerDesktopIpc(escposModule) {
  ipcMain.handle('desktop:get-company-login-code', () => {
    const cfg = loadConfig();
    return cfg.companyLoginCode || '';
  });

  ipcMain.handle('desktop:get-api-base-url', () => {
    const cfg = loadConfig();
    const origin = String(cfg.backendOrigin || '').replace(/\/$/, '');
    return origin ? `${origin}/api/v1` : '';
  });

  ipcMain.handle('desktop:open-server-setup', async () => {
    await openServerSettings();
    return { ok: true };
  });
  ipcMain.handle('desktop:reload', async () => reloadCashierPage());
  ipcMain.handle('desktop:toggle-fullscreen', () => {
    const mainWindow = state.getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    return { ok: true };
  });
  ipcMain.handle('desktop:prepare-for-print', () => {
    const mainWindow = state.getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
    return { ok: true };
  });
  ipcMain.handle('desktop:quit', () => {
    app.quit();
    return { ok: true };
  });

  ipcMain.handle('desktop:list-printers', async () => {
    const mainWindow = state.getMainWindow();
    const wc = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;
    if (!wc) return [];
    try {
      return await wc.getPrintersAsync();
    } catch {
      return [];
    }
  });

  ipcMain.handle('desktop:get-printer-settings', () => readPrinterSettings());
  ipcMain.handle('desktop:set-printer-settings', (_e, settings) => writePrinterSettings(settings || {}));

  ipcMain.handle('desktop:open-printer-picker', async () => {
    await showPrinterPickerWindow(state.getMainWindow(), { kind: 'receipt' });
    return readPrinterSettings();
  });

  ipcMain.handle('desktop:open-label-printer-picker', async () => {
    await showPrinterPickerWindow(state.getMainWindow(), { kind: 'label' });
    return readPrinterSettings();
  });

  ipcMain.handle('desktop:open-barcode-page', () => {
    const mainWindow = state.getMainWindow();
    const config = state.getConfig();
    if (mainWindow && !mainWindow.isDestroyed() && config?.cashierUrl) {
      mainWindow.loadURL(`${config.cashierUrl}/users/barcode-print`);
    }
    return { ok: true };
  });

  ipcMain.handle('desktop:check-updates', async () => {
    const config = loadConfig();
    state.setConfig(config);
    return checkForUpdatesNow(config?.cashierUrl);
  });

  registerScaleIpc(ipcMain, () => state.getMainWindow());
  registerLabelTsplIpc(ipcMain);
  registerOfflineIpc(() => state.getConfig(), probeBackendOnlineQuick);

  if (escposModule?.registerEscposIpcHandlers) {
    escposModule.registerEscposIpcHandlers(ipcMain, {
      resolveReceiptPrinterName,
      resolveLabelPrinterName,
    });
  } else {
    ipcMain.handle('desktop:print-receipt-escpos', async () => {
      const err = new Error(
        'Печать чека недоступна в этой сборке. Скачайте Aurent Cashier 1.0.43+ с /install.',
      );
      err.code = 'DRIVER_MISSING';
      throw err;
    });
  }
}

module.exports = { registerDesktopIpc };

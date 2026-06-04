/**
 * USB/RS-232 весы для кассы Aurent (Electron main process).
 * @see README.md в этой папке
 */

const scaleManager = require('./scale-manager.cjs');
const { readScaleSettings, writeScaleSettings } = require('./scale-config.cjs');
const { autoDetectPort } = require('./scale-auto-detect.cjs');
const { showScalePickerWindow } = require('./scale-picker-window.cjs');

function registerScaleIpc(ipcMain, getMainWindow) {
  scaleManager.setBroadcast((reading) => {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send('desktop:scale-weight', reading);
    }
  });

  ipcMain.handle('desktop:scale-status', () => scaleManager.getStatus());
  ipcMain.handle('desktop:scale-list-ports', () => scaleManager.listSerialPorts());
  ipcMain.handle('desktop:scale-get-settings', () => readScaleSettings());
  ipcMain.handle('desktop:scale-set-settings', (_e, patch) => writeScaleSettings(patch || {}));
  ipcMain.handle('desktop:scale-start', () => scaleManager.startListening());
  ipcMain.handle('desktop:scale-stop', () => scaleManager.stopListening());
  ipcMain.handle('desktop:scale-capture', () => scaleManager.captureStable());
  ipcMain.handle('desktop:scale-is-available', async () => {
    const st = await scaleManager.getStatus();
    return Boolean(st.serialModuleLoaded || st.mockEnv || st.settings?.mock || st.settings?.port);
  });

  ipcMain.handle('desktop:scale-auto-detect', (_e, opts) =>
    autoDetectPort({ save: opts?.save !== false })
  );

  ipcMain.handle('desktop:open-scale-picker', async () => {
    const saved = await showScalePickerWindow(getMainWindow());
    return saved;
  });
}

module.exports = {
  registerScaleIpc,
  scaleManager,
  readScaleSettings,
  writeScaleSettings,
  autoDetectPort,
  showScalePickerWindow,
};


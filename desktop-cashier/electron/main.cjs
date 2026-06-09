const { app, dialog } = require('electron');
const { applyDesktopNetworkEnv } = require('./bootstrap/env.cjs');
const { bootstrapApp, registerAppQuitHandlers } = require('./bootstrap/app.cjs');
const { logStartup } = require('./core/startup-log.cjs');

applyDesktopNetworkEnv();
registerAppQuitHandlers();

app.whenReady().then(bootstrapApp).catch((err) => {
  logStartup('bootstrap_fatal', { message: err?.message || String(err) });
  dialog.showErrorBox(
    'Aurent — Касса',
    `Ошибка запуска:\n${err?.message || err}\n\nЛог: %APPDATA%\\Aurent Cashier\\startup.log`,
  );
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

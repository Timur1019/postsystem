const { app, BrowserWindow, dialog } = require('electron');
const {
  loadConfig,
  migrateToEmbeddedIfNeeded,
} = require('../core/config.cjs');
const { logStartup } = require('../core/startup-log.cjs');
const { resolveWebDist } = require('../network/embedded-server.cjs');
const { stopEmbeddedUi } = require('../network/embedded-server.cjs');
const { autoRepairBackendOrigin } = require('../network/api-health.cjs');
const { startConnectivityBroadcast, stopConnectivityBroadcast } = require('../connectivity/broadcast.cjs');
const { registerDesktopIpc } = require('../ipc/desktop.cjs');
const { registerLabelPrintIpc } = require('../ipc/label-print.cjs');
const { buildAppMenu } = require('../menu/app-menu.cjs');
const { createMainWindow } = require('../window/main-window.cjs');
const { registerTrustedCertificateHandler } = require('../window/navigation.cjs');
const { setupAutoUpdater } = require('../updates/auto-update.cjs');
const localDb = require('../offline/index.cjs');
const state = require('./state.cjs');
const {
  waitForServices,
  ensureInitialServerConfig,
  handleStartupHealthFailure,
} = require('./services.cjs');

function loadEscposModule() {
  try {
    return require('../cashier-receipt-escpos/index.cjs');
  } catch (err) {
    console.error('[Aurent] ESC/POS module load failed:', err?.message || err);
    return null;
  }
}

async function bootstrapApp() {
  const escposModule = loadEscposModule();

  logStartup('app_ready', {
    version: app.getVersion(),
    platform: process.platform,
    packaged: app.isPackaged,
    escpos: Boolean(escposModule),
    webDist: Boolean(resolveWebDist()),
  });

  registerDesktopIpc(escposModule);
  registerLabelPrintIpc();
  buildAppMenu();

  if (migrateToEmbeddedIfNeeded()) {
    logStartup('config_migrated_embedded');
  }

  let config = loadConfig();
  state.setConfig(config);
  logStartup('config_loaded', {
    useEmbedded: config.useEmbedded,
    useRemoteUi: config.useRemoteUi,
    cashierUrl: config.cashierUrl,
    backendOrigin: config.backendOrigin,
  });

  config = await autoRepairBackendOrigin();
  state.setConfig(config);
  registerTrustedCertificateHandler();

  const hasConfig = await ensureInitialServerConfig();
  if (!hasConfig) {
    app.quit();
    return;
  }

  config = loadConfig();
  state.setConfig(config);

  let check = await waitForServices();
  if (!check.ok) {
    check = await handleStartupHealthFailure(check);
    if (!check.ok) {
      dialog.showErrorBox('Aurent — Касса', check.message);
      app.quit();
      return;
    }
  }

  logStartup('create_window', { cashierUrl: state.getConfig()?.cashierUrl });
  createMainWindow();
  localDb
    .getDb()
    .then(() => logStartup('offline_db_prewarm_ok'))
    .catch((err) => logStartup('offline_db_prewarm_failed', { message: err?.message || String(err) }));
  startConnectivityBroadcast();

  setupAutoUpdater({
    getMainWindow: () => state.getMainWindow(),
    getCashierUrl: () => state.getConfig()?.cashierUrl,
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}

function registerAppQuitHandlers() {
  app.on('quit', () => {
    stopConnectivityBroadcast();
    stopEmbeddedUi();
  });
}

module.exports = {
  bootstrapApp,
  registerAppQuitHandlers,
};

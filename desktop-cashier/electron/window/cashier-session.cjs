const fs = require('fs');
const { dialog } = require('electron');
const {
  loadConfig,
  migrateToEmbeddedIfNeeded,
} = require('../core/config.cjs');
const { startEmbeddedUi, resolveWebDist } = require('../network/embedded-server.cjs');
const { probeApiHealth } = require('../network/api-health.cjs');
const { showSetupWindow, configPath } = require('../setup/setup-window.cjs');
const { showServerSetupPasswordWindow } = require('../setup/password-window.cjs');
const state = require('../bootstrap/state.cjs');

function buildLoginUrl(cfg) {
  const base = `${String(cfg.cashierUrl || '').replace(/\/$/, '')}/cashier/login`;
  const code = String(cfg.companyLoginCode || '').trim();
  if (!code) return base;
  return `${base}?${new URLSearchParams({ companyLoginCode: code })}`;
}

function hasUserServerConfig() {
  try {
    return fs.existsSync(configPath());
  } catch {
    return false;
  }
}

async function configureServerInteractive() {
  await showSetupWindow(state.getConfig());
  const next = loadConfig();
  state.setConfig(next);
  return next;
}

async function clearCashierWebStorage(cfg) {
  const mainWindow = state.getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed() || !cfg?.cashierUrl) return;
  try {
    const origin = new URL(cfg.cashierUrl).origin;
    await mainWindow.webContents.session.clearStorageData({
      origin,
      storages: ['localstorage'],
    });
  } catch {
    // ignore invalid origin or session errors
  }
}

async function reloadCashierLogin(cfg, { clearSession = false } = {}) {
  const mainWindow = state.getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (clearSession) {
    await clearCashierWebStorage(cfg);
  }
  mainWindow.loadURL(buildLoginUrl(cfg));
}

async function ensureEmbeddedUiRunning(cfg) {
  if (!resolveWebDist()) return cfg;
  const next = loadConfig();
  if (!next.useEmbedded) return next;
  try {
    const url = await startEmbeddedUi({
      port: next.embeddedPort,
      backendOrigin: next.backendOrigin,
    });
    if (url) {
      next.cashierUrl = url.replace(/\/$/, '');
    }
  } catch {
    // ignore — reload may still work
  }
  return next;
}

async function reloadCashierPage() {
  const mainWindow = state.getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return { ok: false };

  let config = state.getConfig();
  if (migrateToEmbeddedIfNeeded()) {
    config = loadConfig();
  } else {
    config = loadConfig();
  }
  state.setConfig(config);

  const hasEmbedded = Boolean(resolveWebDist());
  if (hasEmbedded) {
    config = await ensureEmbeddedUiRunning(config);
    state.setConfig(config);
    const current = mainWindow.webContents.getURL();
    let pathPart = '/cashier/pos';
    try {
      const parsed = new URL(current);
      if (parsed.pathname.startsWith('/cashier') || parsed.pathname.startsWith('/login')) {
        pathPart = `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // keep default
    }
    const isLocal =
      current.includes('127.0.0.1') || current.includes('localhost') || current.startsWith('file:');
    if (isLocal) {
      mainWindow.webContents.reload();
    } else {
      await mainWindow.loadURL(`${config.cashierUrl}${pathPart}`);
    }
    return { ok: true };
  }

  const probe = await probeApiHealth(config);
  if (!probe?.ok) {
    dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Aurent — Касса',
      message: 'Нет связи с сервером',
      detail: 'Обновление страницы без интернета недоступно. Подключите сеть или перезапустите приложение.',
      buttons: ['OK'],
    });
    return { ok: false };
  }
  mainWindow.webContents.reload();
  return { ok: true };
}

async function openServerSettings() {
  try {
    let config = loadConfig();
    state.setConfig(config);
    if (hasUserServerConfig()) {
      await showServerSetupPasswordWindow(config);
    }
    config = await configureServerInteractive();
    if (config.useEmbedded) {
      await startEmbeddedUi({
        port: config.embeddedPort,
        backendOrigin: config.backendOrigin,
      });
      config.cashierUrl = `http://127.0.0.1:${config.embeddedPort}`.replace(/\/$/, '');
    }
    state.setConfig(config);
    await reloadCashierLogin(config, { clearSession: true });
  } catch {
    // cancelled
  }
}

module.exports = {
  buildLoginUrl,
  hasUserServerConfig,
  configureServerInteractive,
  reloadCashierLogin,
  ensureEmbeddedUiRunning,
  reloadCashierPage,
  openServerSettings,
};

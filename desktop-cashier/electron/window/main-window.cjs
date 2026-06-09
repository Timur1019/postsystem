const path = require('path');
const { BrowserWindow, dialog, shell } = require('electron');
const {
  loadConfig,
  migrateToEmbeddedIfNeeded,
} = require('../core/config.cjs');
const { resolveWebDist } = require('../network/embedded-server.cjs');
const { buildLoginUrl, ensureEmbeddedUiRunning } = require('./cashier-session.cjs');
const { isAllowedLocation } = require('./navigation.cjs');
const state = require('../bootstrap/state.cjs');
const { windowIconOptions } = require('../core/window-icon.cjs');

function fitWindowToPosDisplay(win) {
  try {
    const { screen } = require('electron');
    const area = screen.getPrimaryDisplay().workAreaSize;
    if (area.width <= 1366 && area.height <= 900) {
      win.maximize();
    }
  } catch {
    /* ignore */
  }
}

function createMainWindow() {
  const config = state.getConfig();
  const mainWindow = new BrowserWindow({
    ...windowIconOptions(),
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    center: true,
    title: 'Aurent — Касса',
    autoHideMenuBar: process.platform === 'darwin',
    backgroundColor: '#f1f5f9',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      preload: path.join(__dirname, '..', 'preload.cjs'),
    },
  });

  state.setMainWindow(mainWindow);

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const guardNavigation = (event, url) => {
    if (!isAllowedLocation(url)) {
      event.preventDefault();
    }
  };

  mainWindow.webContents.on('will-navigate', guardNavigation);
  mainWindow.webContents.on('will-redirect', guardNavigation);

  mainWindow.webContents.on('did-fail-load', async (_event, code, description, url) => {
    if (code === -3) return;
    if (migrateToEmbeddedIfNeeded() || resolveWebDist()) {
      let nextConfig = loadConfig();
      state.setConfig(nextConfig);
      nextConfig = await ensureEmbeddedUiRunning(nextConfig);
      state.setConfig(nextConfig);
      const isRemote =
        url && !url.includes('127.0.0.1') && !url.includes('localhost');
      if (isRemote && nextConfig.useEmbedded) {
        let pathPart = '/cashier/login';
        try {
          const parsed = new URL(url);
          pathPart = `${parsed.pathname}${parsed.search}`;
        } catch {
          // keep login
        }
        mainWindow.loadURL(`${nextConfig.cashierUrl}${pathPart}`);
        return;
      }
    }
    dialog.showErrorBox(
      'Aurent — Касса',
      `Не удалось загрузить страницу:\n${url}\n\n${description} (${code})\n\n` +
        'Проверьте адрес сервера (Вид → Настройка сервера). Интерфейс кассы работает локально; нужен интернет только для синхронизации.',
    );
  });

  fitWindowToPosDisplay(mainWindow);
  mainWindow.loadURL(buildLoginUrl(config));
}

module.exports = { createMainWindow };

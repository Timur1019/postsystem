const { app, BrowserWindow, dialog, shell, Menu } = require('electron');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { loadConfig } = require('./config.cjs');
const { startEmbeddedUi, stopEmbeddedUi } = require('./embedded-server.cjs');
const { showSetupWindow, configPath } = require('./setup-window.cjs');

const ALLOWED_PATH_PREFIXES = ['/login', '/cashier', '/receipt'];

let mainWindow;
let config;

function hasUserServerConfig() {
  try {
    return fs.existsSync(configPath());
  } catch {
    return false;
  }
}

async function configureServerInteractive() {
  const saved = await showSetupWindow(config);
  config.backendOrigin = saved.backendOrigin;
  config.apiHealthUrl = saved.apiHealthUrl;
  if (config.useEmbedded) {
    await stopEmbeddedUi();
    const url = await startEmbeddedUi({
      port: config.embeddedPort,
      backendOrigin: config.backendOrigin,
    });
    config.cashierUrl = url.replace(/\/$/, '');
  }
  return config;
}

function buildAppMenu() {
  const template = [
    {
      label: 'Aurent',
      submenu: [
        {
          label: 'Настройка сервера…',
          click: async () => {
            try {
              await configureServerInteractive();
              if (mainWindow) {
                mainWindow.loadURL(`${config.cashierUrl}/login`);
              }
            } catch {
              // cancelled
            }
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Выход' },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload', label: 'Обновить' },
        { role: 'togglefullscreen', label: 'На весь экран' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function isAllowedLocation(urlString) {
  try {
    const target = new URL(urlString);
    const base = new URL(config.cashierUrl);
    if (target.origin !== base.origin) {
      return false;
    }
    return ALLOWED_PATH_PREFIXES.some((prefix) => target.pathname === prefix || target.pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

function httpOk(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServices() {
  if (config.useEmbedded) {
    try {
      const url = await startEmbeddedUi({
        port: config.embeddedPort,
        backendOrigin: config.backendOrigin,
      });
      config.cashierUrl = url.replace(/\/$/, '');
    } catch (err) {
      return {
        ok: false,
        message: `Не удалось запустить интерфейс кассы:\n${err.message}`,
      };
    }
  }

  const frontendOk = await httpOk(`${config.cashierUrl}/`);
  if (!frontendOk) {
    return {
      ok: false,
      message: `Интерфейс кассы недоступен:\n${config.cashierUrl}`,
    };
  }

  let apiOk = await httpOk(config.apiHealthUrl);
  if (!apiOk) {
    try {
      await configureServerInteractive();
      apiOk = await httpOk(config.apiHealthUrl);
    } catch {
      apiOk = false;
    }
  }

  if (!apiOk) {
    return {
      ok: false,
      message:
        `Сервер Aurent не отвечает:\n${config.apiHealthUrl}\n\n` +
        'Проверьте:\n' +
        '• сервер запущен и доступен в сети\n' +
        '• IP/порт указаны верно\n' +
        '• файрвол пропускает порт API (обычно 8080)',
    };
  }

  return { ok: true };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Aurent — Касса',
    autoHideMenuBar: true,
    backgroundColor: '#f1f5f9',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
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
      mainWindow.loadURL(`${config.cashierUrl}/cashier/pos`);
    }
  };

  mainWindow.webContents.on('will-navigate', guardNavigation);
  mainWindow.webContents.on('will-redirect', guardNavigation);

  mainWindow.loadURL(`${config.cashierUrl}/login`);
}

app.whenReady().then(async () => {
  buildAppMenu();
  config = loadConfig();

  if (!hasUserServerConfig()) {
    try {
      await configureServerInteractive();
      config = loadConfig();
    } catch {
      app.quit();
      return;
    }
  }

  let check = await waitForServices();
  if (!check.ok) {
    const retry = dialog.showMessageBoxSync({
      type: 'error',
      title: 'Aurent — Касса',
      message: 'Не удалось подключиться к серверу',
      detail: check.message,
      buttons: ['Настроить сервер', 'Закрыть'],
      defaultId: 0,
      cancelId: 1,
    });
    if (retry === 0) {
      config = loadConfig();
      check = await waitForServices();
    }
    if (!check.ok) {
      dialog.showErrorBox('Aurent — Касса', check.message);
      app.quit();
      return;
    }
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  stopEmbeddedUi();
});

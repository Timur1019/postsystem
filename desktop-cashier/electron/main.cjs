const { app, BrowserWindow, dialog, shell, Menu, ipcMain } = require('electron');
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
  await showSetupWindow(config);
  config = loadConfig();
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
    req.setTimeout(5000, () => {
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
    const hint = config.useRemoteUi
      ? `Проверьте, что на сервере запущен веб (порт ${config.webPort || '80'}) и файрвол его пропускает.`
      : '';
    return {
      ok: false,
      message: `Интерфейс кассы недоступен:\n${config.cashierUrl}\n\n${hint}`.trim(),
    };
  }

  const apiHealthUrl = config.useRemoteUi
    ? `${config.cashierUrl}/api/v1/actuator/health`
    : config.useEmbedded
      ? `${config.cashierUrl}/api/v1/actuator/health`
      : config.apiHealthUrl;

  let apiOk = await httpOk(apiHealthUrl);
  if (!apiOk && !config.useRemoteUi) {
    apiOk = await httpOk(config.apiHealthUrl);
  }
  if (!apiOk) {
    try {
      await configureServerInteractive();
      config = loadConfig();
      const retryUrl = config.useRemoteUi
        ? `${config.cashierUrl}/api/v1/actuator/health`
        : config.apiHealthUrl;
      apiOk = await httpOk(retryUrl);
    } catch {
      apiOk = false;
    }
  }

  if (!apiOk) {
    const healthLine = config.useRemoteUi
      ? `${config.cashierUrl}/api/v1/actuator/health`
      : config.apiHealthUrl;
    return {
      ok: false,
      message:
        `Сервер Aurent не отвечает:\n${healthLine}\n\n` +
        'Проверьте:\n' +
        '• сервер запущен (bash deploy/git-update.sh)\n' +
        '• IP и порты указаны верно\n' +
        (config.useRemoteUi
          ? `• файрвол пропускает порт веб-интерфейса (обычно ${config.webPort || '80'})`
          : '• файрвол пропускает порт API (обычно 8080)'),
    };
  }

  return { ok: true };
}

function waitForReceiptReady(webContents, timeoutMs = 12000) {
  return webContents.executeJavaScript(`
    new Promise((resolve) => {
      if (window.__posReceiptReady) {
        resolve(true);
        return;
      }
      const done = () => {
        window.removeEventListener('pos-receipt-ready', done);
        resolve(true);
      };
      window.addEventListener('pos-receipt-ready', done, { once: true });
      setTimeout(() => resolve(false), ${timeoutMs});
    })
  `);
}

function printReceiptInHiddenWindow(receiptNumber) {
  const encoded = encodeURIComponent(String(receiptNumber).trim());
  const url = `${config.cashierUrl}/receipt/${encoded}?silent=1`;

  const printWin = new BrowserWindow({
    show: false,
    width: 640,
    height: 1200,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  printWin.webContents.setZoomFactor(1);

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (!printWin.isDestroyed()) {
        printWin.close();
      }
    };

    printWin.webContents.on('did-fail-load', () => {
      cleanup();
      reject(new Error('Не удалось загрузить чек для печати'));
    });

    printWin
      .loadURL(url)
      .then(() => waitForReceiptReady(printWin.webContents))
      .then(() => new Promise((r) => setTimeout(r, 400)))
      .then(() =>
        printWin.webContents.executeJavaScript(`
          (() => {
            document.documentElement.classList.add('print-thermal-only');
            const paper = getComputedStyle(document.documentElement).getPropertyValue('--print-paper-w-mm').trim() || '80';
            const margin = getComputedStyle(document.documentElement).getPropertyValue('--print-page-margin-mm').trim() || '0';
            let el = document.getElementById('pos-print-job-page');
            if (!el) {
              el = document.createElement('style');
              el.id = 'pos-print-job-page';
              document.head.appendChild(el);
            }
            el.textContent = '@page { size: ' + paper + 'mm auto; margin: ' + margin + '; }';
            return true;
          })()
        `)
      )
      .then(
        () =>
          new Promise((res, rej) => {
            printWin.webContents.print(
              {
                silent: true,
                printBackground: true,
                margins: { marginType: 'none' },
              },
              (success, failureReason) => {
                cleanup();
                if (success) res();
                else rej(new Error(failureReason || 'Печать отменена'));
              }
            );
          })
      )
      .then(resolve)
      .catch((err) => {
        cleanup();
        reject(err);
      });
  });
}

ipcMain.handle('print-receipt', async (event, receiptNumber) => {
  if (!receiptNumber || !config?.cashierUrl) {
    throw new Error('Некорректный номер чека');
  }
  if (!isAllowedLocation(`${config.cashierUrl}/receipt/${receiptNumber}`)) {
    throw new Error('Недопустимый URL чека');
  }
  await printReceiptInHiddenWindow(receiptNumber);
  return { ok: true };
});

ipcMain.handle('print-current-page', async (event) => {
  const wc = event.sender;
  if (!wc || wc.isDestroyed()) {
    throw new Error('Окно печати недоступно');
  }
  return new Promise((resolve, reject) => {
    wc.print(
      {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' },
      },
      (success, failureReason) => {
        if (success) resolve({ ok: true });
        else reject(new Error(failureReason || 'Печать отменена'));
      }
    );
  });
});

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
      try {
        await configureServerInteractive();
        check = await waitForServices();
      } catch {
        check = { ok: false, message: check.message };
      }
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

const { app, BrowserWindow, dialog, shell, Menu, ipcMain } = require('electron');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { loadConfig } = require('./config.cjs');
const { buildOrigin, buildHealthUrl } = require('./server-url.cjs');
const { startEmbeddedUi, stopEmbeddedUi } = require('./embedded-server.cjs');
const { showSetupWindow, configPath } = require('./setup-window.cjs');
const {
  paperWidthPx,
  waitForImages,
  prepareThermalPrintInPage,
  runSilentPrint,
  createReceiptPrintWindow,
  ensureWindowPainted,
} = require('./print-thermal.cjs');

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
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve(false);
      return;
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** Health: HTTPS :443, HTTP :80, прямой API :8080. */
function collectApiHealthUrls(cfg) {
  const urls = [];
  const push = (base) => {
    if (!base) return;
    let b = String(base).trim();
    if (!b) return;
    b = b.replace(/\/api\/v1\/actuator\/health\/?$/i, '').replace(/\/$/, '');
    if (!/^https?:\/\//i.test(b)) {
      b = `http://${b}`;
    }
    urls.push(buildHealthUrl(b));
  };
  if (cfg.useEmbedded && cfg.cashierUrl) {
    push(cfg.cashierUrl);
  }
  push(cfg.apiHealthUrl);
  push(cfg.backendOrigin);
  if (cfg.useRemoteUi && cfg.cashierUrl) {
    push(cfg.cashierUrl);
  }
  try {
    const u = new URL(cfg.backendOrigin || cfg.cashierUrl || 'http://127.0.0.1');
    const host = u.hostname;
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      const seen = new Set(urls);
      for (const port of ['443', '80', '8080']) {
        const line = buildHealthUrl(buildOrigin(host, port));
        if (!seen.has(line)) urls.push(line);
      }
    }
  } catch {
    // ignore
  }
  return [...new Set(urls)];
}

async function probeApiHealth(cfg) {
  const urls = collectApiHealthUrls(cfg);
  for (const url of urls) {
    if (await httpOk(url)) {
      return { ok: true, url };
    }
  }
  return { ok: false, tried: urls };
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

  let apiProbe = await probeApiHealth(config);
  if (!apiProbe.ok) {
    try {
      await configureServerInteractive();
      config = loadConfig();
      if (config.useEmbedded) {
        const url = await startEmbeddedUi({
          port: config.embeddedPort,
          backendOrigin: config.backendOrigin,
        });
        config.cashierUrl = url.replace(/\/$/, '');
      }
      apiProbe = await probeApiHealth(config);
    } catch {
      apiProbe = { ok: false, tried: apiProbe.tried || [] };
    }
  }

  if (!apiProbe.ok) {
    const tried = (apiProbe.tried || []).slice(0, 4).join('\n');
    return {
      ok: false,
      message:
        `Сервер Aurent не отвечает.\n\n` +
        `Проверялись адреса:\n${tried}\n\n` +
        'Что сделать:\n' +
        '• Укажите IP сервера без http://\n' +
        '• HTTPS (aurent.uz): порт **443**, HTTP — **80**\n' +
        '• В браузере на этом ПК откройте:\n' +
        `  https://ВАШ_ДОМЕН/api/v1/actuator/health\n` +
        '  Должно быть: {"status":"UP"}\n' +
        '• На сервере: bash deploy/git-update.sh',
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
  const paperMm = 80;
  const printWin = createReceiptPrintWindow({
    width: paperWidthPx(paperMm),
    height: 1600,
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
      .then((ready) => {
        if (!ready) {
          throw new Error('Чек не успел загрузиться для печати');
        }
      })
      .then(() => ensureWindowPainted(printWin))
      .then(() => waitForImages(printWin.webContents))
      .then(() => new Promise((r) => setTimeout(r, 400)))
      .then(() => prepareThermalPrintInPage(printWin.webContents))
      .then((dims) => {
        if (!dims?.textLen || dims.contentHeightPx < 20) {
          throw new Error('Чек пустой — проверьте вход в кассу и связь с сервером');
        }
        return runSilentPrint(printWin.webContents, dims);
      })
      .then(() => {
        cleanup();
      })
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
  const hasModal = await wc.executeJavaScript(
    'Boolean(document.getElementById("fiscal-print-shell"))'
  );
  const extra = hasModal ? ['print-thermal-modal'] : [];
  await waitForImages(wc);
  await new Promise((r) => setTimeout(r, 200));
  const dims = await prepareThermalPrintInPage(wc, extra);
  if (!dims?.textLen || dims.contentHeightPx < 20) {
    throw new Error('Нет содержимого для печати');
  }
  await runSilentPrint(wc, dims);
  return { ok: true };
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

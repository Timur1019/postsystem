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
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** Пробуем health на :80 (nginx) и :8080 (прямой API) — на Windows часто открыт только 80. */
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
    urls.push(`${b}/api/v1/actuator/health`);
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
      for (const port of ['80', '8080']) {
        const line = `http://${host}:${port}/api/v1/actuator/health`;
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
        '• Порт: обычно **80** (если админ не дал другой)\n' +
        '• В браузере на этом ПК откройте:\n' +
        `  http://ВАШ_IP/api/v1/actuator/health\n` +
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

/** Подготовка DOM и размер листа для термопринтера (мм → микроны для Chromium). */
function prepareThermalPrintInPage(webContents, extraClasses = []) {
  const classes = ['print-thermal-only', 'electron-silent-print', ...extraClasses];
  const classList = classes.map((c) => `'${c}'`).join(', ');
  return webContents.executeJavaScript(`
    (async () => {
      const add = [${classList}];
      add.forEach((c) => document.documentElement.classList.add(c));
      const paper = getComputedStyle(document.documentElement).getPropertyValue('--print-paper-w-mm').trim() || '80';
      const margin = getComputedStyle(document.documentElement).getPropertyValue('--print-page-margin-mm').trim() || '0';
      let el = document.getElementById('pos-print-job-page');
      if (!el) {
        el = document.createElement('style');
        el.id = 'pos-print-job-page';
        document.head.appendChild(el);
      }
      el.textContent = '@page { size: ' + paper + 'mm auto; margin: ' + margin + '; }';
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const area =
        document.getElementById('receipt-print-area') ||
        document.getElementById('fiscal-print-shell');
      const h = area ? Math.max(area.scrollHeight, area.offsetHeight) : document.body.scrollHeight;
      const heightMm = Math.max(50, Math.ceil((h / 96) * 25.4) + 8);
      return { paperMm: parseFloat(paper) || 80, heightMm };
    })()
  `);
}

function runSilentPrint(webContents, dims) {
  const paperMm = dims?.paperMm || 80;
  const heightMm = dims?.heightMm || 200;
  return new Promise((resolve, reject) => {
    webContents.print(
      {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' },
        pageSize: {
          width: Math.round(paperMm * 1000),
          height: Math.round(heightMm * 1000),
        },
      },
      (success, failureReason) => {
        if (success) resolve();
        else reject(new Error(failureReason || 'Печать отменена'));
      }
    );
  });
}

function paperWidthPx(paperMm) {
  return Math.max(280, Math.round((paperMm / 25.4) * 96) + 48);
}

function printReceiptInHiddenWindow(receiptNumber) {
  const encoded = encodeURIComponent(String(receiptNumber).trim());
  const url = `${config.cashierUrl}/receipt/${encoded}?silent=1`;
  const paperMm = 80;
  const printWin = new BrowserWindow({
    show: false,
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
      .then(() => new Promise((r) => setTimeout(r, 500)))
      .then(() => prepareThermalPrintInPage(printWin.webContents))
      .then((dims) => runSilentPrint(printWin.webContents, dims))
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
  const dims = await prepareThermalPrintInPage(wc, extra);
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

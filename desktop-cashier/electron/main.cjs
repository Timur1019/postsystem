const { app, BrowserWindow, dialog, shell, Menu, ipcMain } = require('electron');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const {
  loadConfig,
  readPrinterSettings,
  writePrinterSettings,
} = require('./config.cjs');
const { buildOrigin, buildHealthUrl } = require('./server-url.cjs');
const { startEmbeddedUi, stopEmbeddedUi } = require('./embedded-server.cjs');
const { showSetupWindow, configPath } = require('./setup-window.cjs');
const { showPrinterPickerWindow } = require('./printer-picker-window.cjs');
const { matchPrinterName } = require('./printer-match.cjs');
const {
  waitForImages,
  waitForPaintFrames,
  runSilentReceiptAutoPrint,
  runSilentLabelPrint,
  MEASURE_RECEIPT_DIMS_JS,
} = require('./print-thermal.cjs');
const { setupAutoUpdater, checkForUpdatesNow } = require('./auto-update.cjs');

const ALLOWED_PATH_PREFIXES = ['/login', '/cashier', '/receipt', '/users/barcode-print'];

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

async function openServerSettings() {
  try {
    await configureServerInteractive();
    config = loadConfig();
    if (config.useEmbedded) {
      await startEmbeddedUi({
        port: config.embeddedPort,
        backendOrigin: config.backendOrigin,
      });
      config.cashierUrl = `http://127.0.0.1:${config.embeddedPort}`.replace(/\/$/, '');
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`${config.cashierUrl}/login`);
    }
  } catch {
    // cancelled
  }
}

function buildAppMenuTemplate() {
  return [
    {
      label: 'Aurent',
      submenu: [{ role: 'quit', label: 'Выход' }],
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Настройка сервера…',
          accelerator: 'CmdOrCtrl+,',
          click: () => openServerSettings(),
        },
        { type: 'separator' },
        {
          label: 'Проверить обновления…',
          click: () => {
            checkForUpdatesNow(config?.cashierUrl).then((result) => {
              if (result.updateAvailable) {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'Aurent — обновление',
                  message: `Доступна версия ${result.version}`,
                  detail: 'Загрузка начнётся автоматически.',
                  buttons: ['OK'],
                }).catch(() => {});
              } else if (result.ok) {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'Aurent — обновление',
                  message: 'Установлена последняя версия',
                  buttons: ['OK'],
                }).catch(() => {});
              } else if (result.reason !== 'dev') {
                dialog.showMessageBox({
                  type: 'warning',
                  title: 'Aurent — обновление',
                  message: 'Не удалось проверить обновления',
                  detail: String(result.reason || ''),
                  buttons: ['OK'],
                }).catch(() => {});
              }
            });
          },
        },
        { role: 'reload', label: 'Обновить' },
        { role: 'togglefullscreen', label: 'На весь экран' },
      ],
    },
  ];
}

function buildAppMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildAppMenuTemplate()));
}

function registerDesktopIpc() {
  ipcMain.handle('desktop:open-server-setup', async () => {
    await openServerSettings();
    return { ok: true };
  });
  ipcMain.handle('desktop:reload', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reload();
    }
    return { ok: true };
  });
  ipcMain.handle('desktop:toggle-fullscreen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    return { ok: true };
  });
  ipcMain.handle('desktop:prepare-for-print', () => {
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
    await showPrinterPickerWindow(mainWindow, { kind: 'receipt' });
    return readPrinterSettings();
  });

  ipcMain.handle('desktop:open-label-printer-picker', async () => {
    await showPrinterPickerWindow(mainWindow, { kind: 'label' });
    return readPrinterSettings();
  });

  ipcMain.handle('desktop:open-barcode-page', () => {
    if (mainWindow && !mainWindow.isDestroyed() && config?.cashierUrl) {
      mainWindow.loadURL(`${config.cashierUrl}/users/barcode-print`);
    }
    return { ok: true };
  });

  ipcMain.handle('desktop:check-updates', async () => {
    config = loadConfig();
    return checkForUpdatesNow(config?.cashierUrl);
  });
}

function normalizeHost(host) {
  return String(host || '')
    .toLowerCase()
    .replace(/^www\./, '');
}

function hostsMatch(a, b) {
  return normalizeHost(a) === normalizeHost(b);
}

function isAllowedLocation(urlString) {
  try {
    const target = new URL(urlString);
    const base = new URL(config.cashierUrl);
    if (!hostsMatch(target.hostname, base.hostname)) {
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
      for (const port of ['8081', '443', '80', '8080']) {
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
        '• HTTPS (aurent.uz): порт **443**, HTTP — **8081** (не 80)\n' +
        '• В браузере на этом ПК откройте:\n' +
        `  https://ВАШ_ДОМЕН/api/v1/actuator/health\n` +
        '  Должно быть: {"status":"UP"}\n' +
        '• На сервере: bash deploy/git-update.sh',
    };
  }

  return { ok: true };
}

async function listSystemPrinters() {
  const wc = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;
  if (!wc) return [];
  try {
    return await wc.getPrintersAsync();
  } catch {
    return [];
  }
}

const PRINTER_KIND = {
  receipt: { field: 'receiptPrinterName', pickerKind: 'receipt' },
  label: { field: 'labelPrinterName', pickerKind: 'label' },
};

/**
 * Имя принтера из config.json (точное имя Windows).
 * Первый раз (или если принтер пропал) — окно выбора; дальше только сохранённое.
 * Смена: меню Aurent → «Принтер чека».
 */
async function resolvePrinterByKind(kind, { promptIfMissing = true } = {}) {
  const meta = PRINTER_KIND[kind] || PRINTER_KIND.receipt;
  const saved = readPrinterSettings()[meta.field];
  const printers = await listSystemPrinters();

  const matched = matchPrinterName(saved, printers);
  if (matched) {
    if (matched !== saved) {
      writePrinterSettings({ [meta.field]: matched });
    }
    return matched;
  }

  if (saved && printers.length > 0) {
    writePrinterSettings({ [meta.field]: '' });
  }

  if (!promptIfMissing) {
    const def = printers.find((p) => p.isDefault);
    if (def?.name) return def.name;
    const thermal = printers.find((p) =>
      /pos-80|pos80|xprinter|termo|receipt|thermal|чек/i.test(p.name)
    );
    if (thermal?.name) return thermal.name;
    return saved || '';
  }

  if (!printers.length) {
    dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Aurent — печать',
      message: 'В Windows не найден ни один принтер.',
      detail:
        'Подключите термопринтер, установите драйвер, затем: меню Aurent → «Принтер чека».',
      buttons: ['OK'],
    });
    return '';
  }

  await showPrinterPickerWindow(mainWindow, { kind: meta.pickerKind });
  const chosen = readPrinterSettings()[meta.field] || '';
  if (!chosen) {
    throw new Error('Принтер не выбран. Меню Aurent → «Принтер чека».');
  }
  return chosen;
}

function resolveReceiptPrinterName(options) {
  return resolvePrinterByKind('receipt', options);
}

function resolveLabelPrinterName(options) {
  return resolvePrinterByKind('label', options);
}

ipcMain.handle('print-label-page', async (event) => {
  const wc = event.sender;
  if (!wc || wc.isDestroyed()) {
    throw new Error('Окно печати недоступно');
  }
  const hasLayer = await wc.executeJavaScript(
    'Boolean(document.getElementById("shelf-label-print-layer"))'
  );
  if (!hasLayer) {
    throw new Error('Нет этикеток для печати');
  }
  await waitForImages(wc);
  await new Promise((r) => setTimeout(r, 200));
  const deviceName = await resolveLabelPrinterName();
  await runSilentLabelPrint(wc, { deviceName });
  return { ok: true };
});

ipcMain.handle('desktop:print-receipt-auto', async (event) => {
  const wc = event.sender;
  if (!wc || wc.isDestroyed()) {
    throw new Error('Окно печати недоступно');
  }
  const ready = await wc.executeJavaScript(`
    (() => {
      const roots = ['#pos-sale-print-shell', '#fiscal-print-shell'];
      for (const sel of roots) {
        const root = document.querySelector(sel);
        if (!root) continue;
        const area = root.querySelector('#receipt-print-area') || root.querySelector('.receipt-print-root') || root;
        const textLen = (area.innerText || '').trim().length;
        const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
        const imgs = Array.from(area.querySelectorAll('img'));
        const imgsReady = imgs.length === 0 || imgs.every((i) => i.complete);
        if (textLen >= 80 && h >= 120 && imgsReady) return true;
      }
      return false;
    })()
  `);
  if (!ready) {
    throw new Error('Чек не готов для автопечати');
  }
  await waitForImages(wc);
  await waitForPaintFrames(wc);
  await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 900 : 300));
  const dims = await wc.executeJavaScript(MEASURE_RECEIPT_DIMS_JS);
  if (!dims?.textLen || dims.textLen < 80) {
    throw new Error('Чек пустой для автопечати');
  }
  await waitForPaintFrames(wc);
  const deviceName = await resolveReceiptPrinterName({ promptIfMissing: false });
  const printers = await listSystemPrinters();
  const result = await runSilentReceiptAutoPrint(wc, { deviceName, printers, dims });
  return { ok: true, ...result };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Aurent — Касса',
    // Windows: строка меню в окне (Вид → Настройка сервера); Mac — в системной строке
    autoHideMenuBar: process.platform === 'darwin',
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
    }
  };

  mainWindow.webContents.on('will-navigate', guardNavigation);
  mainWindow.webContents.on('will-redirect', guardNavigation);

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    if (code === -3) return;
    dialog.showErrorBox(
      'Aurent — Касса',
      `Не удалось загрузить страницу:\n${url}\n\n${description} (${code})\n\n` +
        'Проверьте адрес сервера (Вид → Настройка сервера): IP 111.88.132.126, порт 8081.'
    );
  });

  mainWindow.loadURL(`${config.cashierUrl}/login`);
}

function registerTrustedCertificateHandler() {
  app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    try {
      const target = new URL(url);
      const bases = [config?.cashierUrl, config?.backendOrigin].filter(Boolean);
      const trusted = bases.some((base) => {
        const origin = new URL(base);
        return hostsMatch(target.hostname, origin.hostname);
      });
      if (trusted) {
        event.preventDefault();
        callback(true);
        return;
      }
    } catch {
      // ignore
    }
    callback(false);
  });
}

app.whenReady().then(async () => {
  registerDesktopIpc();
  buildAppMenu();
  config = loadConfig();
  registerTrustedCertificateHandler();

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

  setupAutoUpdater({
    getMainWindow: () => mainWindow,
    getCashierUrl: () => config?.cashierUrl,
  });

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

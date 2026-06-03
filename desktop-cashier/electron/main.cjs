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
  waitForLabelImages,
  waitForPaintFrames,
  runSilentLabelPrint,
  MEASURE_LABEL_DIMS_JS,
} = require('./print-thermal.cjs');
const { setupAutoUpdater, checkForUpdatesNow } = require('./auto-update.cjs');

/** ESC/POS: при ошибке require окно кассы всё равно должно открыться (Windows .exe). */
function loadEscposModule() {
  try {
    return require('./cashier-receipt-escpos/index.cjs');
  } catch (err) {
    console.error('[Aurent] ESC/POS module load failed:', err?.message || err);
    return null;
  }
}

const escposModule = loadEscposModule();

const ALLOWED_PATH_PREFIXES = ['/login', '/cashier', '/receipt', '/users/barcode-print'];

let mainWindow;
let config;

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
  await showSetupWindow(config);
  config = loadConfig();
  return config;
}

async function clearCashierWebStorage(cfg) {
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
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (clearSession) {
    await clearCashierWebStorage(cfg);
  }
  mainWindow.loadURL(buildLoginUrl(cfg));
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
    await reloadCashierLogin(config, { clearSession: true });
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
  ipcMain.handle('desktop:get-company-login-code', () => {
    const cfg = loadConfig();
    return cfg.companyLoginCode || '';
  });

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

  if (escposModule?.registerEscposIpcHandlers) {
    escposModule.registerEscposIpcHandlers(ipcMain, { resolveReceiptPrinterName });
  } else {
    ipcMain.handle('desktop:print-receipt-escpos', async () => {
      const err = new Error(
        'Печать чека недоступна в этой сборке. Скачайте Aurent Cashier 1.0.43+ с /install.',
      );
      err.code = 'DRIVER_MISSING';
      throw err;
    });
  }
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
      if (!url) {
        return {
          ok: false,
          message:
            'В установке нет встроенного интерфейса (web-dist).\n' +
            'Переустановите кассу с сайта /install или укажите сервер в «Настройка сервера».',
        };
      }
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
    if (kind === 'label') {
      const labelLike = printers.find((p) =>
        /label|zebra|tsc|barcode|этикет|штрих|godex|argox|xprinter.*365|xp-365/i.test(p.name)
      );
      if (labelLike?.name) return labelLike.name;
    } else {
      const thermal = printers.find((p) =>
        /pos-80|pos80|xprinter|termo|receipt|thermal|чек/i.test(p.name)
      );
      if (thermal?.name) return thermal.name;
    }
    const def = printers.find((p) => p.isDefault);
    if (def?.name) return def.name;
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

async function safeExecuteJavaScript(wc, script, stepLabel) {
  try {
    return await wc.executeJavaScript(script);
  } catch (err) {
    const detail = err?.message || String(err);
    if (/Script failed to execute/i.test(detail)) {
      throw new Error(`Сбой подготовки печати (${stepLabel}). Повторите операцию.`);
    }
    throw err;
  }
}

const LABEL_READY_JS = `
  (() => {
    const layer = document.getElementById('shelf-label-print-layer');
    if (!layer) return false;
    const pages = layer.querySelectorAll('.shelflabel-print-page');
    if (!pages.length) return false;
    const h = Math.max(layer.scrollHeight, layer.offsetHeight, layer.getBoundingClientRect().height);
    if (h < 30) return false;
    const svgs = layer.querySelectorAll('.shelflabel-barcode-svg');
    if (!svgs.length) return true;
    return [...svgs].every((s) => s.querySelector('rect, path, line, g'));
  })()
`;

async function waitLabelReadyForPrint(wc, attempts = 10) {
  for (let i = 0; i < attempts; i += 1) {
    const ready = await safeExecuteJavaScript(wc, LABEL_READY_JS, 'этикетка');
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 120 + i * 100));
  }
  return false;
}

ipcMain.handle('print-label-page', async (event) => {
  const wc = event.sender;
  if (!wc || wc.isDestroyed()) {
    throw new Error('Окно печати недоступно');
  }
  const ready = await waitLabelReadyForPrint(wc);
  if (!ready) {
    throw new Error('Этикетка не готова для печати (штрихкод или макет)');
  }
  await waitForLabelImages(wc);
  await waitForPaintFrames(wc);
  await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 400 : 250));
  const dims = await safeExecuteJavaScript(wc, MEASURE_LABEL_DIMS_JS, 'размер этикетки');
  if (!dims?.heightMm) {
    throw new Error('Этикетка пустая для печати');
  }
  const printers = await listSystemPrinters();
  const savedLabel = readPrinterSettings().labelPrinterName || '';
  const deviceName =
    matchPrinterName(savedLabel, printers) ||
    (await resolveLabelPrinterName({ promptIfMissing: false }));
  if (!String(deviceName || '').trim()) {
    throw new Error(
      'Принтер этикеток не выбран. Меню Aurent → «Принтер штрих-кодов» — укажите устройство из списка Windows.'
    );
  }
  await runSilentLabelPrint(wc, { deviceName, printers, dims });
  return { ok: true, deviceName };
});

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    center: true,
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

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    if (code === -3) return;
    dialog.showErrorBox(
      'Aurent — Касса',
      `Не удалось загрузить страницу:\n${url}\n\n${description} (${code})\n\n` +
        'Проверьте адрес сервера (Вид → Настройка сервера): IP 111.88.132.126, порт 8081.'
    );
  });

  fitWindowToPosDisplay(mainWindow);
  mainWindow.loadURL(buildLoginUrl(config));
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

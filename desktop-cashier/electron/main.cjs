const { app, BrowserWindow, dialog, shell, Menu, ipcMain } = require('electron');

// Windows: системный прокси часто ломает прямое подключение к IP:8081 (Mac без прокси работает).
app.commandLine.appendSwitch('no-proxy-server');
process.env.NO_PROXY = '*';
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const {
  loadConfig,
  readPrinterSettings,
  writePrinterSettings,
  migrateToEmbeddedIfNeeded,
  writeUserConfig,
} = require('./config.cjs');
const { buildOrigin, buildHealthUrl } = require('./server-url.cjs');
const { startEmbeddedUi, stopEmbeddedUi } = require('./embedded-server.cjs');
const { showSetupWindow, configPath } = require('./setup-window.cjs');
const { showServerSetupPasswordWindow } = require('./server-setup-password-window.cjs');
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
const { registerScaleIpc } = require('./scales/index.cjs');
const { registerLabelTsplIpc } = require('./label-tspl/index.cjs');
const { registerOfflineIpc } = require('./offline/ipc.cjs');
const localDb = require('./offline/local-db.cjs');
const { logStartup } = require('./startup-log.cjs');
const { resolveWebDist } = require('./embedded-server.cjs');
const { httpGet } = require('./http-client.cjs');
const { probeBackendOnlineQuick } = require('./connectivity-probe.cjs');

const ALLOWED_PATH_PREFIXES = ['/login', '/cashier', '/receipt', '/users/barcode-print'];

let mainWindow;
let config;
let connectivityTimer;

async function broadcastConnectivity() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    const bootstrap = await localDb.getBootstrapStatus();
    let apiOnline = false;
    try {
      apiOnline = await probeBackendOnlineQuick(config);
    } catch {
      apiOnline = false;
    }
    mainWindow.webContents.send('offline:connectivity', {
      ...bootstrap,
      apiOnline,
      offlineMode: !apiOnline,
      canSellOffline: bootstrap.bootstrapReady && bootstrap.productCount > 0,
    });
  } catch {
    // ignore broadcast errors
  }
}

function startConnectivityBroadcast() {
  if (connectivityTimer) return;
  broadcastConnectivity();
  connectivityTimer = setInterval(broadcastConnectivity, 12_000);
}

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

/** Безопасное «Обновить»: не перезагружать aurent.uz без сети. */
async function reloadCashierPage() {
  if (!mainWindow || mainWindow.isDestroyed()) return { ok: false };

  if (migrateToEmbeddedIfNeeded()) {
    config = loadConfig();
  } else {
    config = loadConfig();
  }

  const hasEmbedded = Boolean(resolveWebDist());
  if (hasEmbedded) {
    config = await ensureEmbeddedUiRunning(config);
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
    config = loadConfig();
    if (hasUserServerConfig()) {
      await showServerSetupPasswordWindow(config);
    }
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
        { type: 'separator' },
        {
          label: 'Обновить',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            reloadCashierPage().catch((err) => {
              console.error('[Aurent] reload failed:', err?.message || err);
            });
          },
        },
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

  ipcMain.handle('desktop:get-api-base-url', () => {
    const cfg = loadConfig();
    const origin = String(cfg.backendOrigin || '').replace(/\/$/, '');
    return origin ? `${origin}/api/v1` : '';
  });

  ipcMain.handle('desktop:open-server-setup', async () => {
    await openServerSettings();
    return { ok: true };
  });
  ipcMain.handle('desktop:reload', async () => reloadCashierPage());
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

  registerScaleIpc(ipcMain, () => mainWindow);
  registerLabelTsplIpc(ipcMain);
  registerOfflineIpc(() => config, probeBackendOnlineQuick);

  if (escposModule?.registerEscposIpcHandlers) {
    escposModule.registerEscposIpcHandlers(ipcMain, {
      resolveReceiptPrinterName,
      resolveLabelPrinterName,
    });
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
  return httpGet(url, { timeoutMs: 8000 });
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
      const preferredPort = String(cfg.apiPort || u.port || '').trim();
      if (preferredPort) {
        const preferred = buildHealthUrl(buildOrigin(host, preferredPort));
        urls.unshift(preferred);
        seen.add(preferred);
      }
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

async function autoRepairBackendOrigin() {
  const directHealth = buildHealthUrl(config.backendOrigin);
  if (await httpOk(directHealth)) {
    logStartup('backend_ok', { backendOrigin: config.backendOrigin });
    return config;
  }

  logStartup('backend_unreachable', {
    backendOrigin: config.backendOrigin,
    directHealth,
  });

  const urls = collectApiHealthUrls(config);
  for (const url of urls) {
    if (url === directHealth) continue;
    if (!(await httpOk(url))) continue;
    const origin = url.replace(/\/api\/v1\/actuator\/health\/?$/i, '').replace(/\/$/, '');
    try {
      const u = new URL(origin.startsWith('http') ? origin : `http://${origin}`);
      const apiPort = u.port || (u.protocol === 'https:' ? '443' : '80');
      const backendOrigin = `${u.protocol}//${u.host}`;
      writeUserConfig({
        backendOrigin,
        apiPort: String(apiPort),
        webPort: String(apiPort),
        apiHealthUrl: url,
        useRemoteUi: false,
      });
      stopEmbeddedUi();
      config = loadConfig();
      logStartup('config_auto_repaired', { backendOrigin: config.backendOrigin, healthUrl: url });
      return config;
    } catch {
      // try next url
    }
  }
  return config;
}

async function probeApiHealth(cfg) {
  const urls = collectApiHealthUrls(cfg);
  for (const url of urls) {
    if (await httpOk(url)) {
      logStartup('health_ok', { url });
      return { ok: true, url };
    }
  }
  logStartup('health_failed_all', { tried: urls.slice(0, 6), backendOrigin: cfg.backendOrigin });
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
  if (!apiProbe.ok && !config.useEmbedded) {
    try {
      await configureServerInteractive();
      config = loadConfig();
      if (config.useEmbedded) {
        const url = await startEmbeddedUi({
          port: config.embeddedPort,
          backendOrigin: config.backendOrigin,
        });
        if (url) {
          config.cashierUrl = url.replace(/\/$/, '');
        }
      }
      apiProbe = await probeApiHealth(config);
    } catch {
      apiProbe = { ok: false, tried: apiProbe.tried || [] };
    }
  }

  if (!apiProbe.ok) {
    if (config.useEmbedded) {
      return { ok: true, offline: true };
    }
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
      return '';
    }
    const thermal = printers.find((p) =>
      /pos-80|pos80|xprinter|termo|receipt|thermal|чек/i.test(p.name)
    );
    if (thermal?.name) return thermal.name;
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
    document.documentElement.classList.add('shelflabel-layout-measure');
    try {
      const layer = document.getElementById('shelf-label-print-layer');
      if (!layer) return false;
      const pages = layer.querySelectorAll('.shelflabel-print-page');
      if (!pages.length) return false;
      const page = pages[0];
      const h = Math.max(
        page.offsetHeight || 0,
        page.scrollHeight || 0,
        page.getBoundingClientRect().height || 0,
        layer.scrollHeight || 0
      );
      const paperHmm = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--label-paper-h-mm')
      ) || 0;
      if (h < 8 && paperHmm < 15) return false;
      const svgs = layer.querySelectorAll('.shelflabel-barcode-svg');
      if (!svgs.length) return true;
      return [...svgs].every((s) => s.querySelector('rect, path, line, g, text'));
    } finally {
      document.documentElement.classList.remove('shelflabel-layout-measure');
    }
  })()
`;

async function waitLabelReadyForPrint(wc, attempts = 45) {
  for (let i = 0; i < attempts; i += 1) {
    const ready = await safeExecuteJavaScript(wc, LABEL_READY_JS, 'этикетка');
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 120 + i * 100));
  }
  return false;
}

ipcMain.handle('print-label-page', async (event, opts) => {
  const wc = event.sender;
  if (!wc || wc.isDestroyed()) {
    throw new Error('Окно печати недоступно');
  }
  const copies = Math.min(999, Math.max(1, Math.trunc(Number(opts?.copies) || 1)));
  const ready = await waitLabelReadyForPrint(wc);
  if (!ready) {
    throw new Error('Этикетка не готова для печати (штрихкод или макет)');
  }
  await waitForLabelImages(wc);
  await waitForPaintFrames(wc);
  await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 400 : 250));
  const dims = await safeExecuteJavaScript(wc, MEASURE_LABEL_DIMS_JS, 'размер этикетки');
  if (!dims?.pageHmm || dims.pageCount !== 1) {
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
  await runSilentLabelPrint(wc, { deviceName, printers, dims, copies });
  return { ok: true, deviceName, copies };
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
      /** Прямые API-запросы desktop → backend (Windows, fallback если прокси недоступен). */
      webSecurity: false,
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

  mainWindow.webContents.on('did-fail-load', async (_event, code, description, url) => {
    if (code === -3) return;
    if (migrateToEmbeddedIfNeeded() || resolveWebDist()) {
      config = loadConfig();
      config = await ensureEmbeddedUiRunning(config);
      const isRemote =
        url && !url.includes('127.0.0.1') && !url.includes('localhost');
      if (isRemote && config.useEmbedded) {
        let pathPart = '/cashier/login';
        try {
          const parsed = new URL(url);
          pathPart = `${parsed.pathname}${parsed.search}`;
        } catch {
          // keep login
        }
        mainWindow.loadURL(`${config.cashierUrl}${pathPart}`);
        return;
      }
    }
    dialog.showErrorBox(
      'Aurent — Касса',
      `Не удалось загрузить страницу:\n${url}\n\n${description} (${code})\n\n` +
        'Проверьте адрес сервера (Вид → Настройка сервера). Интерфейс кассы работает локально; нужен интернет только для синхронизации.'
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

async function bootstrapApp() {
  logStartup('app_ready', {
    version: app.getVersion(),
    platform: process.platform,
    packaged: app.isPackaged,
    escpos: Boolean(escposModule),
    webDist: Boolean(resolveWebDist()),
  });
  registerDesktopIpc();
  buildAppMenu();
  if (migrateToEmbeddedIfNeeded()) {
    logStartup('config_migrated_embedded');
  }
  config = loadConfig();
  logStartup('config_loaded', {
    useEmbedded: config.useEmbedded,
    useRemoteUi: config.useRemoteUi,
    cashierUrl: config.cashierUrl,
    backendOrigin: config.backendOrigin,
  });
  config = await autoRepairBackendOrigin();
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
    logStartup('health_failed', { message: check.message });
    const hasEmbeddedUi = Boolean(config?.useEmbedded || resolveWebDist());
    const buttons = hasEmbeddedUi
      ? ['Настроить сервер', 'Открыть кассу офлайн', 'Закрыть']
      : ['Настроить сервер', 'Закрыть'];
    const retry = dialog.showMessageBoxSync({
      type: 'error',
      title: 'Aurent — Касса',
      message: 'Не удалось подключиться к серверу',
      detail: `${check.message}\n\nПроверьте интернет и порт 8081 (или 443 для HTTPS).${
        hasEmbeddedUi ? '\n\nМожно открыть кассу в офлайн-режиме, если каталог уже был загружен ранее.' : ''
      }`,
      buttons,
      defaultId: hasEmbeddedUi ? 1 : 0,
      cancelId: buttons.length - 1,
    });
    if (retry === 0) {
      try {
        await configureServerInteractive();
        config = loadConfig();
        check = await waitForServices();
      } catch {
        check = { ok: false, message: check.message };
      }
    } else if (hasEmbeddedUi && retry === 1) {
      logStartup('health_bypass_offline');
      if (config.useEmbedded) {
        try {
          const url = await startEmbeddedUi({
            port: config.embeddedPort,
            backendOrigin: config.backendOrigin,
          });
          if (url) config.cashierUrl = url.replace(/\/$/, '');
        } catch {
          /* UI may still load from prior session */
        }
      }
      check = { ok: true, offline: true };
    }
    if (!check.ok) {
      dialog.showErrorBox('Aurent — Касса', check.message);
      app.quit();
      return;
    }
  }
  logStartup('create_window', { cashierUrl: config?.cashierUrl });
  createWindow();
  localDb
    .getDb()
    .then(() => logStartup('offline_db_prewarm_ok'))
    .catch((err) => logStartup('offline_db_prewarm_failed', { message: err?.message || String(err) }));
  startConnectivityBroadcast();

  setupAutoUpdater({
    getMainWindow: () => mainWindow,
    getCashierUrl: () => config?.cashierUrl,
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

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

app.on('quit', () => {
  if (connectivityTimer) {
    clearInterval(connectivityTimer);
    connectivityTimer = null;
  }
  stopEmbeddedUi();
});

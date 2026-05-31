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
const { buildReceiptBodyHtml } = require('./receipt-html-builder.cjs');
const {
  paperWidthPx,
  waitForImages,
  prepareThermalPrintInPage,
  cleanupThermalPrintInPage,
  waitForPaintFrames,
  runSilentPrint,
  runSilentReceiptPrint,
  runSilentLabelPrint,
  createReceiptPrintWindow,
  ensureWindowPainted,
  printHtmlInHiddenWindow,
  showWindowForPrint,
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

  ipcMain.handle('desktop:print-test-receipt', async () => {
    await printTestReceiptInHiddenWindow();
    return { ok: true };
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

function waitForReceiptReady(webContents, timeoutMs = 25000) {
  return webContents.executeJavaScript(`
    new Promise((resolve) => {
      const deadline = Date.now() + ${timeoutMs};
      const finish = (ok) => resolve(Boolean(ok));
      const isLayoutReady = () => {
        const area =
          document.getElementById('receipt-print-area') ||
          document.getElementById('fiscal-print-shell');
        if (!area) return false;
        const textLen = (area.innerText || '').trim().length;
        const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
        const imgsReady = Array.from(document.images).every((img) => img.complete);
        return textLen >= 40 && h >= 80 && imgsReady;
      };
      const done = () => {
        window.removeEventListener('pos-receipt-ready', done);
        if (isLayoutReady()) {
          finish(true);
        } else {
          setTimeout(() => finish(isLayoutReady()), 400);
        }
      };
      if (window.__posReceiptReady && isLayoutReady()) {
        finish(true);
        return;
      }
      window.addEventListener('pos-receipt-ready', done, { once: true });
      const poll = () => {
        if (window.__posReceiptReady && isLayoutReady()) {
          window.removeEventListener('pos-receipt-ready', done);
          finish(true);
          return;
        }
        if (Date.now() >= deadline) {
          window.removeEventListener('pos-receipt-ready', done);
          finish(isLayoutReady());
          return;
        }
        setTimeout(poll, 150);
      };
      setTimeout(poll, 150);
    })
  `);
}

async function printReceiptInHiddenWindow(receiptNumber) {
  const encoded = encodeURIComponent(String(receiptNumber).trim());
  const url = `${config.cashierUrl}/receipt/${encoded}?silent=1`;
  const paperMm = 80;
  const deviceName = await resolveReceiptPrinterName();
  const printers = await listSystemPrinters();
  const mainSession =
    mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.session : undefined;

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 900 : 400));
    }
    const printWin = createReceiptPrintWindow({
      width: paperWidthPx(paperMm),
      height: 1600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.cjs'),
        ...(mainSession ? { session: mainSession } : {}),
      },
    });
    printWin.webContents.setZoomFactor(1);

    try {
      await printWin.loadURL(url);
      const ready = await waitForReceiptReady(printWin.webContents);
      if (!ready) {
        throw new Error('Чек не успел загрузиться для печати');
      }
      await ensureWindowPainted(printWin);
      await waitForImages(printWin.webContents);
      await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 1400 : 400));
      await waitForPaintFrames(printWin.webContents);
      const dims = await prepareThermalPrintInPage(printWin.webContents);
      if (!dims?.textLen || dims.textLen < 80 || dims.contentHeightPx < 120) {
        throw new Error('Чек пустой — проверьте вход в кассу и связь с сервером');
      }
      if (!printWin.isDestroyed()) {
        const h = Math.min(5000, Math.max(900, Math.ceil(dims.contentHeightPx * 1.15)));
        printWin.setSize(paperWidthPx(paperMm), h);
      }
      await waitForPaintFrames(printWin.webContents);
      await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 400 : 120));
      showWindowForPrint(printWin, paperWidthPx(paperMm), Math.min(5000, Math.max(900, Math.ceil(dims.contentHeightPx * 1.2))));
      await waitForPaintFrames(printWin.webContents);
      await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 400 : 120));
      await runSilentReceiptPrint(printWin.webContents, { deviceName, printers, dims });
      await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 600 : 200));
      await cleanupThermalPrintInPage(printWin.webContents);
      if (!printWin.isDestroyed()) {
        printWin.close();
      }
      return;
    } catch (err) {
      lastErr = err;
      await cleanupThermalPrintInPage(printWin.webContents);
      if (!printWin.isDestroyed()) {
        printWin.close();
      }
    }
  }
  throw lastErr || new Error('Печать чека не выполнена');
}

async function printReceiptSaleInHiddenWindow(payload, options = {}) {
  const sale = payload && typeof payload === 'object' ? { ...payload } : null;
  if (!sale?.receiptNumber) {
    throw new Error('Некорректные данные чека');
  }
  const branding = sale._branding || {};
  delete sale._branding;
  const bodyHtml = buildReceiptBodyHtml(sale, branding);
  const plainLen = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
  if (plainLen < 40) {
    throw new Error('Чек без текста для печати');
  }
  const deviceName = await resolveReceiptPrinterName({ promptIfMissing: false });
  const printers = await listSystemPrinters();
  const mainSession =
    mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.session : undefined;
  const useDialog =
    Boolean(options.useDialog) ||
    (process.platform === 'win32' && config?.receiptUsePrintDialog === true);

  try {
    const result = await printHtmlInHiddenWindow(bodyHtml, {
      deviceName,
      printers,
      session: mainSession,
      useDialog,
    });
    return result;
  } catch (err) {
    if (process.platform === 'win32' && !useDialog) {
      return printHtmlInHiddenWindow(bodyHtml, {
        deviceName,
        printers,
        session: mainSession,
        useDialog: true,
      });
    }
    throw err;
  }
}

async function printReceiptHtmlInHiddenWindow(bodyHtml) {
  const deviceName = await resolveReceiptPrinterName({ promptIfMissing: false });
  const printers = await listSystemPrinters();
  const mainSession =
    mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.session : undefined;
  const html = String(bodyHtml || '').trim();
  if (!html || html.length < 40) {
    throw new Error('Пустой чек для печати');
  }
  const plainLen = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
  if (plainLen < 40) {
    throw new Error('Чек без текста для печати');
  }
  await printHtmlInHiddenWindow(html, {
    deviceName,
    printers,
    session: mainSession,
  });
}

function buildTestReceiptDataUrl() {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — тестовый чек</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; }
    .wrap { padding: 6mm 3mm; width: 72mm; box-sizing: border-box; }
    h1 { font-size: 16px; margin: 0 0 4mm; text-align: center; }
    .hr { border-top: 1px dashed #000; margin: 3mm 0; }
    .row { display: flex; justify-content: space-between; padding: 1mm 0; }
    .center { text-align: center; }
    .muted { color: #444; font-size: 11px; }
  </style>
</head>
<body>
  <div id="receipt-print-area" class="wrap">
    <h1>AURENT — Тест</h1>
    <div class="center muted">Тестовая печать термопринтера</div>
    <div class="hr"></div>
    <div class="row"><span>Чек</span><span>TEST-0001</span></div>
    <div class="row"><span>Принтер</span><span>OK</span></div>
    <div class="row"><span>Ширина</span><span>80 мм</span></div>
    <div class="hr"></div>
    <div class="center">Если этот лист вышел —<br/>автопечать настроена.</div>
    <div class="hr"></div>
    <div class="center muted">aurent.uz</div>
  </div>
  <script>
    window.__posReceiptReady = true;
    window.dispatchEvent(new CustomEvent('pos-receipt-ready'));
  </script>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

async function printTestReceiptInHiddenWindow() {
  const paperMm = 80;
  const deviceName = await resolveReceiptPrinterName();
  const printers = await listSystemPrinters();
  const printWin = createReceiptPrintWindow({
    width: paperWidthPx(paperMm),
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
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
      reject(new Error('Не удалось подготовить тестовый чек'));
    });

    printWin
      .loadURL(buildTestReceiptDataUrl())
      .then(() => ensureWindowPainted(printWin))
      .then(() => waitForImages(printWin.webContents))
      .then(() => new Promise((r) => setTimeout(r, 200)))
      .then(() => prepareThermalPrintInPage(printWin.webContents))
      .then((dims) =>
        runSilentReceiptPrint(printWin.webContents, { deviceName, printers, dims })
      )
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

ipcMain.handle('print-receipt', async (_event, receiptNumber) => {
  if (!receiptNumber || !config?.cashierUrl) {
    throw new Error('Некорректный номер чека');
  }
  if (!isAllowedLocation(`${config.cashierUrl}/receipt/${receiptNumber}`)) {
    throw new Error('Недопустимый URL чека');
  }
  await printReceiptInHiddenWindow(receiptNumber);
  return { ok: true };
});

ipcMain.handle('print-receipt-sale', async (_event, salePayload) => {
  const result = await printReceiptSaleInHiddenWindow(salePayload);
  return { ok: true, ...(result || {}) };
});

ipcMain.handle('print-receipt-sale-dialog', async (_event, salePayload) => {
  await printReceiptSaleInHiddenWindow(salePayload, { useDialog: true });
  return { ok: true, dialog: true };
});

ipcMain.handle('print-receipt-html', async (_event, bodyHtml) => {
  await printReceiptHtmlInHiddenWindow(bodyHtml);
  return { ok: true };
});

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

ipcMain.handle('print-current-page', async (event) => {
  const wc = event.sender;
  if (!wc || wc.isDestroyed()) {
    throw new Error('Окно печати недоступно');
  }
  try {
    const hasModal = await wc.executeJavaScript(
      'Boolean(document.getElementById("fiscal-print-shell"))'
    );
    const extra = hasModal ? ['print-thermal-modal'] : [];
    await waitForImages(wc);
    await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 900 : 250));
    const dims = await prepareThermalPrintInPage(wc, extra);
    const minText = hasModal ? 80 : 40;
    const minPx = hasModal ? 120 : 80;
    if (!dims?.textLen || dims.textLen < minText || dims.contentHeightPx < minPx) {
      throw new Error('Чек не успел подготовиться для печати');
    }
    await waitForPaintFrames(wc);
    await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 450 : 150));
    const deviceName = await resolveReceiptPrinterName();
    const printers = await listSystemPrinters();
    await runSilentPrint(wc, dims, { deviceName, printers });
    await new Promise((r) => setTimeout(r, process.platform === 'win32' ? 500 : 150));
    return { ok: true };
  } finally {
    await cleanupThermalPrintInPage(wc);
  }
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

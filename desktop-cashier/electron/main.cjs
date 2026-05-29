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
const {
  paperWidthPx,
  waitForImages,
  prepareThermalPrintInPage,
  runSilentPrint,
  runSilentLabelPrint,
  createReceiptPrintWindow,
  ensureWindowPainted,
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

async function listSystemPrinters() {
  const wc = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;
  if (!wc) return [];
  try {
    return await wc.getPrintersAsync();
  } catch {
    return [];
  }
}

/**
 * Кассир ничего не выбирает: один принтер — сохраняем сами; несколько — один раз
 * показываем окно выбора и сохраняем; нет принтеров — печатаем в "по умолчанию".
 */
async function resolveReceiptPrinterName() {
  const saved = readPrinterSettings();
  if (saved.receiptPrinterName) {
    return saved.receiptPrinterName;
  }
  const printers = await listSystemPrinters();
  if (printers.length === 0) {
    return '';
  }
  if (printers.length === 1) {
    const only = printers[0];
    writePrinterSettings({ receiptPrinterName: only.name });
    return only.name;
  }
  await showPrinterPickerWindow(mainWindow, { kind: 'receipt' });
  return readPrinterSettings().receiptPrinterName || '';
}

async function resolveLabelPrinterName() {
  const saved = readPrinterSettings();
  if (saved.labelPrinterName) {
    return saved.labelPrinterName;
  }
  const printers = await listSystemPrinters();
  if (printers.length === 0) {
    return '';
  }
  if (printers.length === 1) {
    const only = printers[0];
    writePrinterSettings({ labelPrinterName: only.name });
    return only.name;
  }
  await showPrinterPickerWindow(mainWindow, { kind: 'label' });
  return readPrinterSettings().labelPrinterName || '';
}

function waitForReceiptReady(webContents, timeoutMs = 12000) {
  return webContents.executeJavaScript(`
    new Promise((resolve) => {
      const deadline = Date.now() + ${timeoutMs};
      const finish = (ok) => resolve(Boolean(ok));
      const done = () => {
        window.removeEventListener('pos-receipt-ready', done);
        finish(true);
      };
      if (window.__posReceiptReady) {
        finish(true);
        return;
      }
      window.addEventListener('pos-receipt-ready', done, { once: true });
      const poll = () => {
        if (window.__posReceiptReady) {
          window.removeEventListener('pos-receipt-ready', done);
          finish(true);
          return;
        }
        if (Date.now() >= deadline) {
          window.removeEventListener('pos-receipt-ready', done);
          finish(false);
          return;
        }
        setTimeout(poll, 120);
      };
      setTimeout(poll, 120);
    })
  `);
}

async function printReceiptInHiddenWindow(receiptNumber) {
  const encoded = encodeURIComponent(String(receiptNumber).trim());
  const url = `${config.cashierUrl}/receipt/${encoded}?silent=1`;
  const paperMm = 80;
  const deviceName = await resolveReceiptPrinterName();
  const mainSession =
    mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.session : undefined;
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
        return runSilentPrint(printWin.webContents, dims, { deviceName });
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
      .then((dims) => runSilentPrint(printWin.webContents, dims, { deviceName }))
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
  const deviceName = await resolveReceiptPrinterName();
  await runSilentPrint(wc, dims, { deviceName });
  return { ok: true };
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
      mainWindow.loadURL(`${config.cashierUrl}/cashier/pos`);
    }
  };

  mainWindow.webContents.on('will-navigate', guardNavigation);
  mainWindow.webContents.on('will-redirect', guardNavigation);

  if (process.platform === 'win32') {
    mainWindow.setMenuBarVisibility(false);
  }

  mainWindow.loadURL(`${config.cashierUrl}/login`);
}

app.whenReady().then(async () => {
  registerDesktopIpc();
  if (process.platform === 'darwin') {
    buildAppMenu();
  } else {
    Menu.setApplicationMenu(null);
  }
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

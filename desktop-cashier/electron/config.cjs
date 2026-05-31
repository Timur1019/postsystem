const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { resolveWebDist } = require('./embedded-server.cjs');
const { buildOrigin } = require('./server-url.cjs');

const DEFAULTS = {
  cashierUrl: 'http://127.0.0.1:5199',
  apiHealthUrl: 'http://localhost:8080/api/v1/actuator/health',
  backendOrigin: 'http://localhost:8080',
  webPort: '80',
  apiPort: '8080',
  embeddedPort: 5199,
};

function readJsonIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {
    // ignore invalid config
  }
  return null;
}

function loadConfig() {
  const fromEnv = {
    cashierUrl: process.env.POS_CASHIER_URL,
    apiHealthUrl: process.env.POS_API_HEALTH_URL,
    backendOrigin: process.env.POS_BACKEND_URL,
    useRemoteUi: process.env.POS_REMOTE_UI === '1' ? true : undefined,
  };

  const candidates = [];
  if (app.isPackaged) {
    candidates.push(path.join(process.resourcesPath, 'config.default.json'));
  } else {
    candidates.push(path.join(__dirname, '..', 'config.default.json'));
  }
  candidates.push(path.join(app.getPath('userData'), 'config.json'));

  let fileConfig = {};
  for (const file of candidates) {
    const parsed = readJsonIfExists(file);
    if (parsed) {
      fileConfig = { ...fileConfig, ...parsed };
    }
  }

  const hasEmbeddedDist = Boolean(resolveWebDist());
  const savedCashierUrl = String(fromEnv.cashierUrl || fileConfig.cashierUrl || '');
  const looksLocalCashier =
    savedCashierUrl.includes('127.0.0.1') || savedCashierUrl.includes('localhost');
  const backendOrigin = (fromEnv.backendOrigin || fileConfig.backendOrigin || DEFAULTS.backendOrigin).replace(
    /\/$/,
    ''
  );

  /** Конфиг под встроенный UI, но в .exe нет web-dist — иначе белый экран на 127.0.0.1. */
  const forceRemoteUi =
    !hasEmbeddedDist &&
    Boolean(backendOrigin && backendOrigin !== DEFAULTS.backendOrigin) &&
    (looksLocalCashier || fileConfig.useRemoteUi === false);

  const useRemoteUi =
    fromEnv.useRemoteUi === true ||
    fileConfig.useRemoteUi === true ||
    forceRemoteUi ||
    (!hasEmbeddedDist &&
      Boolean(savedCashierUrl) &&
      !looksLocalCashier);

  /** Встроенный UI из web-dist; API — на сервер (backendOrigin). */
  const useEmbedded =
    hasEmbeddedDist &&
    !useRemoteUi &&
    (process.env.POS_EMBEDDED === '1' || process.env.POS_FORCE_REMOTE_UI !== '1');

  const embeddedPort = Number(fileConfig.embeddedPort || DEFAULTS.embeddedPort);

  let cashierUrl = fromEnv.cashierUrl || fileConfig.cashierUrl || DEFAULTS.cashierUrl;
  if (useEmbedded) {
    cashierUrl = `http://127.0.0.1:${embeddedPort}`;
  } else if (forceRemoteUi && backendOrigin) {
    try {
      const api = new URL(backendOrigin);
      const webPort = String(fileConfig.webPort || fileConfig.apiPort || api.port || '443');
      cashierUrl = buildOrigin(api.hostname, webPort);
    } catch {
      cashierUrl = backendOrigin;
    }
  }
  cashierUrl = cashierUrl.replace(/\/$/, '');

  let apiHealthUrl = fromEnv.apiHealthUrl || fileConfig.apiHealthUrl;
  if (!apiHealthUrl) {
    apiHealthUrl = useRemoteUi
      ? `${cashierUrl}/api/v1/actuator/health`
      : DEFAULTS.apiHealthUrl;
  }

  return {
    cashierUrl,
    apiHealthUrl,
    backendOrigin,
    embeddedPort,
    useEmbedded,
    useRemoteUi,
    webPort: String(fileConfig.webPort || DEFAULTS.webPort),
    apiPort: String(fileConfig.apiPort || DEFAULTS.apiPort),
    receiptPrinterName: fileConfig.receiptPrinterName || '',
    labelPrinterName: fileConfig.labelPrinterName || '',
    /** Windows: false = пробовать тихую PDF-печать даже после продажи. */
    receiptUsePrintDialog: fileConfig.receiptUsePrintDialog,
    companyLoginCode: String(fileConfig.companyLoginCode || '').trim().toUpperCase(),
  };
}

function userConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function readUserConfig() {
  return readJsonIfExists(userConfigPath()) || {};
}

/**
 * Гранулярная запись (merge): не затираем поля, которые писал кто-то другой.
 */
function writeUserConfig(patch) {
  const file = userConfigPath();
  const current = readUserConfig();
  const merged = { ...current, ...(patch || {}) };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function readPrinterSettings() {
  const cfg = readUserConfig();
  return {
    receiptPrinterName: cfg.receiptPrinterName || '',
    labelPrinterName: cfg.labelPrinterName || '',
  };
}

function writePrinterSettings(settings) {
  const patch = {};
  if (typeof settings?.receiptPrinterName === 'string') {
    patch.receiptPrinterName = settings.receiptPrinterName.trim();
  }
  if (typeof settings?.labelPrinterName === 'string') {
    patch.labelPrinterName = settings.labelPrinterName.trim();
  }
  writeUserConfig(patch);
  return readPrinterSettings();
}

module.exports = {
  loadConfig,
  DEFAULTS,
  userConfigPath,
  readUserConfig,
  writeUserConfig,
  readPrinterSettings,
  writePrinterSettings,
};

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { resolveWebDist } = require('./embedded-server.cjs');

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
  const useRemoteUi =
    fromEnv.useRemoteUi === true ||
    fileConfig.useRemoteUi === true ||
    (Boolean(fromEnv.cashierUrl || fileConfig.cashierUrl) &&
      !String(fromEnv.cashierUrl || fileConfig.cashierUrl).includes('127.0.0.1'));

  const useEmbedded =
    !useRemoteUi && hasEmbeddedDist && process.env.POS_EMBEDDED === '1';

  const embeddedPort = Number(fileConfig.embeddedPort || DEFAULTS.embeddedPort);
  const backendOrigin = (fromEnv.backendOrigin || fileConfig.backendOrigin || DEFAULTS.backendOrigin).replace(
    /\/$/,
    ''
  );

  let cashierUrl = fromEnv.cashierUrl || fileConfig.cashierUrl || DEFAULTS.cashierUrl;
  if (useEmbedded) {
    cashierUrl = `http://127.0.0.1:${embeddedPort}`;
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
  };
}

module.exports = { loadConfig, DEFAULTS };

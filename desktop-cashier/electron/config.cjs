const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { resolveWebDist } = require('./embedded-server.cjs');

const DEFAULTS = {
  cashierUrl: 'http://127.0.0.1:5199',
  apiHealthUrl: 'http://localhost:8080/api/v1/actuator/health',
  backendOrigin: 'http://localhost:8080',
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
  const useEmbedded = hasEmbeddedDist && (app.isPackaged || process.env.POS_EMBEDDED === '1');

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

  return {
    cashierUrl,
    apiHealthUrl: fromEnv.apiHealthUrl || fileConfig.apiHealthUrl || DEFAULTS.apiHealthUrl,
    backendOrigin,
    embeddedPort,
    useEmbedded,
  };
}

module.exports = { loadConfig, DEFAULTS };

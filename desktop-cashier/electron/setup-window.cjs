const { BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { resolveWebDist } = require('./embedded-server.cjs');
const { buildOrigin, buildHealthUrl, parseServerUrl, usesHttps } = require('./server-url.cjs');
const { writeUserConfig } = require('./config.cjs');

const DEFAULT_WEB_PORT = process.env.POS_WEB_PORT || '8081';
const DEFAULT_API_PORT = process.env.POS_API_PORT || '8081';

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function defaultServerHost() {
  if (process.env.POS_DEFAULT_SERVER_HOST) {
    return process.env.POS_DEFAULT_SERVER_HOST;
  }
  try {
    const packaged = path.join(process.resourcesPath, 'server.default.json');
    const dev = path.join(__dirname, '..', 'server.default.json');
    for (const file of [packaged, dev]) {
      if (fs.existsSync(file)) {
        const j = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (j.host) {
          return {
            host: String(j.host),
            webPort: j.webPort || DEFAULT_WEB_PORT,
            apiPort: j.apiPort || DEFAULT_API_PORT,
          };
        }
      }
    }
  } catch {
    // ignore
  }
  return { host: '', webPort: DEFAULT_WEB_PORT, apiPort: DEFAULT_API_PORT };
}

function resolveDefaultHost() {
  const d = defaultServerHost();
  if (typeof d === 'string') {
    return { host: d, webPort: DEFAULT_WEB_PORT, apiPort: DEFAULT_API_PORT };
  }
  return d;
}

function buildSetupHtml(current) {
  const defaults = resolveDefaultHost();
  const host = current?.host || defaults.host;
  const apiPort = current?.apiPort ?? defaults.apiPort;
  const webPort = current?.webPort ?? defaults.webPort;
  const companyLoginCode = current?.companyLoginCode || '';
  const hasEmbedded = Boolean(resolveWebDist());
  const intro = hasEmbedded
    ? 'Укажите адрес магазина (как сказал администратор). Обычно это IP или имя сервера — ничего сложного настраивать не нужно.'
    : 'Укажите адрес сервера магазина. Интерфейс загрузится из сети — после обновления на сервере нажмите «Вид → Обновить».';
  const hint = hasEmbedded
    ? 'Порт API: <strong>443</strong> для HTTPS (aurent.uz). Укажите домен <strong>точно как в браузере</strong> (часто www.aurent.uz, не aurent.uz).'
    : 'Порт сайта и API: <strong>443</strong> для HTTPS. Домен — как в браузере (www.aurent.uz). Для HTTP в сети магазина — 8081.';
  const displayApiPort = apiPort;
  const portFields = hasEmbedded
    ? `<label for="apiPort">Порт сервера (обычно 8081)</label>
    <input id="apiPort" name="apiPort" type="number" placeholder="8081" value="${displayApiPort}" required />
    <input type="hidden" id="webPort" value="${webPort}" />`
    : `<div class="row">
      <div>
        <label for="webPort">Порт сайта</label>
        <input id="webPort" name="webPort" type="number" placeholder="8081" value="${webPort}" required />
      </div>
      <div>
        <label for="apiPort">Порт API</label>
        <input id="apiPort" name="apiPort" type="number" placeholder="8081" value="${apiPort}" required />
      </div>
    </div>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — первый запуск</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 24px;
      background: #f1f5f9; color: #0f172a;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    p { margin: 0 0 16px; color: #475569; font-size: 0.9rem; line-height: 1.45; }
    label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: #334155; }
    input {
      width: 100%; padding: 10px 12px; margin-bottom: 14px;
      border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
    }
    button {
      width: 100%; padding: 12px; border: none; border-radius: 8px;
      background: #0f766e; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    button:hover { background: #0d9488; }
    .hint { font-size: 0.75rem; color: #64748b; margin-top: 12px; line-height: 1.4; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  </style>
</head>
<body>
  <h1>Добро пожаловать в Aurent Касса</h1>
  <p>${intro}</p>
  <form id="f">
    <label for="host">Адрес сервера (IP или домен)</label>
    <input id="host" name="host" placeholder="www.aurent.uz или IP сервера" value="${host}" required autocomplete="off" />
    <label for="companyLoginCode">Код компании (для входа кассиров)</label>
    <input id="companyLoginCode" name="companyLoginCode" placeholder="MIRONKUL" value="${companyLoginCode}" required autocomplete="off" style="text-transform:uppercase;letter-spacing:0.05em;font-family:ui-monospace,monospace;" />
    ${portFields}
    <button type="submit">Продолжить</button>
  </form>
  <p class="hint">${hint}</p>
  <script>
    document.getElementById('f').addEventListener('submit', (e) => {
      e.preventDefault();
      const host = document.getElementById('host').value.trim();
      const webEl = document.getElementById('webPort');
      const apiPort = document.getElementById('apiPort').value.trim() || '8081';
      const webPort = webEl && webEl.type === 'hidden' ? apiPort : (webEl.value.trim() || apiPort);
      const companyLoginCode = document.getElementById('companyLoginCode').value.trim().toUpperCase();
      window.setupApi.save({ host, webPort, apiPort, companyLoginCode });
    });
  </script>
</body>
</html>`)}`;
}

function parseOrigin(url) {
  const parsed = parseServerUrl(url);
  return {
    host: parsed.host,
    port: parsed.port,
    webPort: parsed.port || DEFAULT_WEB_PORT,
  };
}

function normalizeHostPort(host, port) {
  let h = String(host || '').trim().replace(/^https?:\/\//, '').split('/')[0];
  let p = String(port || DEFAULT_API_PORT).trim() || DEFAULT_API_PORT;
  if (h.includes(':')) {
    const [hostname, embeddedPort] = h.split(':');
    h = hostname;
    p = embeddedPort || p;
  }
  return { host: h, port: p };
}

function isLanHost(host) {
  const h = String(host || '').trim().toLowerCase();
  return h === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.endsWith('.local');
}

/** HTTPS и публичный домен — UI с сайта (как браузер); LAN IP:8081 — встроенный UI + прокси. */
function shouldUseRemoteUi(host, webPort, apiPort) {
  const web = String(webPort || '').trim();
  const api = String(apiPort || '').trim();
  if (usesHttps(api) || usesHttps(web)) return true;
  return !isLanHost(host);
}

function normalizeCompanyLoginCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function saveConfig({ host, webPort, apiPort, companyLoginCode }) {
  const code = normalizeCompanyLoginCode(companyLoginCode);
  if (!code) {
    throw new Error('Укажите код компании');
  }
  const { host: h } = normalizeHostPort(host, apiPort);
  let web = String(webPort || DEFAULT_API_PORT).trim() || DEFAULT_API_PORT;
  const api = String(apiPort || DEFAULT_API_PORT).trim() || DEFAULT_API_PORT;
  const hasEmbedded = Boolean(resolveWebDist());
  const embeddedPort = 5199;

  if (hasEmbedded) {
    web = api;
  }

  const origin = buildOrigin(h, api);
  const useRemoteUi = !hasEmbedded || shouldUseRemoteUi(h, web, api);

  const payload = useRemoteUi
    ? {
        useRemoteUi: true,
        cashierUrl: origin,
        backendOrigin: origin,
        webPort: api,
        apiPort: api,
        embeddedPort,
        apiHealthUrl: buildHealthUrl(origin),
        companyLoginCode: code,
      }
    : {
        useRemoteUi: false,
        cashierUrl: `http://127.0.0.1:${embeddedPort}`,
        backendOrigin: buildOrigin(h, api),
        webPort: api,
        apiPort: api,
        embeddedPort,
        apiHealthUrl: buildHealthUrl(buildOrigin(h, api)),
        companyLoginCode: code,
      };
  return writeUserConfig(payload);
}

function showSetupWindow(existing) {
  let parsed = { host: '', apiPort: DEFAULT_API_PORT, webPort: DEFAULT_WEB_PORT, companyLoginCode: '' };
  if (existing?.cashierUrl && existing.useRemoteUi) {
    const web = parseOrigin(existing.cashierUrl);
    parsed = {
      host: web.host,
      webPort: web.webPort || DEFAULT_WEB_PORT,
      apiPort: existing.apiPort || DEFAULT_API_PORT,
      companyLoginCode: existing.companyLoginCode || '',
    };
  } else if (existing?.backendOrigin) {
    const api = parseOrigin(existing.backendOrigin);
    parsed = {
      host: api.host,
      apiPort: api.port,
      webPort: existing.webPort || DEFAULT_WEB_PORT,
      companyLoginCode: existing.companyLoginCode || '',
    };
  }

  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 440,
      height: 540,
      resizable: false,
      title: 'Aurent — настройка сервера',
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'setup-preload.cjs'),
      },
    });

    ipcMain.once('setup:save', (_event, data) => {
      try {
        const saved = saveConfig(data);
        win.close();
        resolve(saved);
      } catch (err) {
        reject(err);
      }
    });

    win.on('closed', () => {
      ipcMain.removeAllListeners('setup:save');
      reject(new Error('cancelled'));
    });

    win.loadURL(buildSetupHtml(parsed));
  });
}

module.exports = { showSetupWindow, saveConfig, configPath };

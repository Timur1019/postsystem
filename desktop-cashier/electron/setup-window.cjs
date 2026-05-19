const { BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_WEB_PORT = process.env.POS_WEB_PORT || '80';
const DEFAULT_API_PORT = process.env.POS_API_PORT || '8080';

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
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — подключение к серверу</title>
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
  <h1>Подключение к серверу Aurent</h1>
  <p>Интерфейс кассы загружается с сервера. После обновления на сервере нажмите «Вид → Обновить» в кассе — переустановка не нужна.</p>
  <form id="f">
    <label for="host">Адрес сервера</label>
    <input id="host" name="host" placeholder="192.168.1.50 или pos.myshop.uz" value="${host}" required />
    <div class="row">
      <div>
        <label for="webPort">Порт веб-интерфейса</label>
        <input id="webPort" name="webPort" type="number" placeholder="80" value="${webPort}" required />
      </div>
      <div>
        <label for="apiPort">Порт API (резерв)</label>
        <input id="apiPort" name="apiPort" type="number" placeholder="8080" value="${apiPort}" required />
      </div>
    </div>
    <button type="submit">Сохранить и подключиться</button>
  </form>
  <p class="hint">Касса откроет http://адрес:${webPort}/ — API через тот же сервер (/api). На файрволе нужен порт ${webPort}.</p>
  <script>
    document.getElementById('f').addEventListener('submit', (e) => {
      e.preventDefault();
      const host = document.getElementById('host').value.trim();
      const webPort = document.getElementById('webPort').value.trim() || '80';
      const apiPort = document.getElementById('apiPort').value.trim() || '8080';
      window.setupApi.save({ host, webPort, apiPort });
    });
  </script>
</body>
</html>`)}`;
}

function parseOrigin(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `http://${url}`);
    return {
      host: u.hostname,
      port: u.port || '8080',
      webPort: u.port || DEFAULT_WEB_PORT,
    };
  } catch {
    return { host: '', port: DEFAULT_API_PORT, webPort: DEFAULT_WEB_PORT };
  }
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

function saveConfig({ host, webPort, apiPort }) {
  const { host: h } = normalizeHostPort(host, apiPort);
  const web = String(webPort || DEFAULT_WEB_PORT).trim() || DEFAULT_WEB_PORT;
  const api = String(apiPort || DEFAULT_API_PORT).trim() || DEFAULT_API_PORT;
  const cashierUrl = `http://${h}:${web}`;
  const backendOrigin = `http://${h}:${api}`;
  const payload = {
    useRemoteUi: true,
    cashierUrl,
    backendOrigin,
    webPort: web,
    apiPort: api,
    apiHealthUrl: `${cashierUrl}/api/v1/actuator/health`,
  };
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function showSetupWindow(existing) {
  let parsed = { host: '', apiPort: DEFAULT_API_PORT, webPort: DEFAULT_WEB_PORT };
  if (existing?.cashierUrl && existing.useRemoteUi) {
    const web = parseOrigin(existing.cashierUrl);
    parsed = { host: web.host, webPort: web.webPort || DEFAULT_WEB_PORT, apiPort: existing.apiPort || DEFAULT_API_PORT };
  } else if (existing?.backendOrigin) {
    const api = parseOrigin(existing.backendOrigin);
    parsed = { host: api.host, apiPort: api.port, webPort: existing.webPort || DEFAULT_WEB_PORT };
  }

  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 440,
      height: 480,
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

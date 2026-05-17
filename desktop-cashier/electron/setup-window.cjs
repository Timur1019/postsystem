const { BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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
        if (j.host) return String(j.host);
      }
    }
  } catch {
    // ignore
  }
  return '';
}

function buildSetupHtml(current) {
  const host = current?.host || defaultServerHost();
  const port = current?.port ?? '8080';
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
    p { margin: 0 0 20px; color: #475569; font-size: 0.9rem; line-height: 1.45; }
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
    .hint { font-size: 0.75rem; color: #64748b; margin-top: 12px; }
  </style>
</head>
<body>
  <h1>Подключение к серверу Aurent</h1>
  <p>Бэкенд установлен на вашем сервере. Укажите его IP или домен — касса подключится к API.</p>
  <form id="f">
    <label for="host">Адрес сервера</label>
    <input id="host" name="host" placeholder="192.168.1.50 или pos.myshop.uz" value="${host}" required />
    <label for="port">Порт API</label>
    <input id="port" name="port" type="number" placeholder="8080" value="${port}" required />
    <button type="submit">Сохранить и подключиться</button>
  </form>
  <p class="hint">Пример: http://192.168.1.50:8080/api/v1/actuator/health</p>
  <script>
    document.getElementById('f').addEventListener('submit', (e) => {
      e.preventDefault();
      const host = document.getElementById('host').value.trim();
      const port = document.getElementById('port').value.trim() || '8080';
      window.setupApi.save({ host, port });
    });
  </script>
</body>
</html>`)}`;
}

function parseOrigin(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `http://${url}`);
    return { host: u.hostname, port: u.port || '8080' };
  } catch {
    return { host: '', port: '8080' };
  }
}

function normalizeHostPort(host, port) {
  let h = String(host || '').trim().replace(/^https?:\/\//, '').split('/')[0];
  let p = String(port || '8080').trim() || '8080';
  if (h.includes(':')) {
    const [hostname, embeddedPort] = h.split(':');
    h = hostname;
    p = embeddedPort || p;
  }
  return { host: h, port: p };
}

function saveConfig({ host, port }) {
  const { host: h, port: p } = normalizeHostPort(host, port);
  const backendOrigin = `http://${h}:${p}`;
  const payload = {
    backendOrigin,
    apiHealthUrl: `${backendOrigin}/api/v1/actuator/health`,
  };
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function showSetupWindow(existing) {
  const parsed = existing?.backendOrigin ? parseOrigin(existing.backendOrigin) : { host: '', port: '8080' };

  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 440,
      height: 420,
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

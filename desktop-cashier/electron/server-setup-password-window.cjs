const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { verifyServerSetupPassword } = require('./verify-server-setup-password.cjs');

function buildPasswordHtml(errorMessage = '') {
  const err = errorMessage
    ? `<p class="err">${errorMessage.replace(/</g, '&lt;')}</p>`
    : '';
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — доступ к настройкам</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 24px;
      background: #f8fafc; color: #0f172a;
    }
    h1 { font-size: 1.15rem; margin: 0 0 8px; }
    p { margin: 0 0 16px; color: #475569; font-size: 0.9rem; line-height: 1.45; }
    label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: #334155; }
    input {
      width: 100%; padding: 10px 12px; margin-bottom: 14px;
      border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
    }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    button {
      padding: 11px; border: none; border-radius: 8px;
      font-size: 0.95rem; font-weight: 600; cursor: pointer;
    }
    .primary { background: #0f766e; color: #fff; }
    .primary:hover { background: #0d9488; }
    .ghost { background: #e2e8f0; color: #334155; }
    .err { color: #b91c1c; font-size: 0.85rem; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h1>Настройка сервера</h1>
  <p>Введите пароль платформы. Его задаёт супер-администратор.</p>
  ${err}
  <form id="f">
    <label for="password">Пароль</label>
    <input id="password" name="password" type="password" autofocus required />
    <div class="actions">
      <button type="button" class="ghost" id="cancel">Отмена</button>
      <button type="submit" class="primary">Продолжить</button>
    </div>
  </form>
  <script>
    document.getElementById('cancel').addEventListener('click', () => window.passwordApi.cancel());
    document.getElementById('f').addEventListener('submit', (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      window.passwordApi.submit(password);
    });
  </script>
</body>
</html>`)}`;
}

function showServerSetupPasswordWindow(cfg, { errorMessage = '' } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const win = new BrowserWindow({
      width: 420,
      height: 300,
      resizable: false,
      center: true,
      show: false,
      title: 'Aurent — пароль настройки сервера',
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'server-setup-password-preload.cjs'),
      },
    });

    const cleanup = () => {
      ipcMain.removeListener('server-setup-password:submit', onSubmit);
      ipcMain.removeListener('server-setup-password:cancel', onCancel);
    };

    const onCancel = () => {
      if (settled) return;
      settled = true;
      cleanup();
      win.close();
      reject(new Error('cancelled'));
    };

    const onSubmit = async (_event, password) => {
      const valid = await verifyServerSetupPassword(cfg, password);
      if (!valid) {
        win.loadURL(buildPasswordHtml('Неверный пароль или нет связи с сервером.'));
        return;
      }
      if (settled) return;
      settled = true;
      cleanup();
      win.close();
      resolve(true);
    };

    ipcMain.on('server-setup-password:submit', onSubmit);
    ipcMain.on('server-setup-password:cancel', onCancel);

    win.once('ready-to-show', () => {
      win.show();
      win.focus();
    });

    win.on('closed', () => {
      cleanup();
      if (!settled) {
        settled = true;
        reject(new Error('cancelled'));
      }
    });

    win.loadURL(buildPasswordHtml(errorMessage));
  });
}

module.exports = { showServerSetupPasswordWindow };

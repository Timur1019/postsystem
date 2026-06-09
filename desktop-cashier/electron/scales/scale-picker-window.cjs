const path = require('path');
const { BrowserWindow, ipcMain } = require('electron');
const { windowIconOptions } = require('../core/window-icon.cjs');
const { listSerialPorts } = require('./scale-serial-port.cjs');
const { readScaleSettings, writeScaleSettings } = require('./scale-config.cjs');
const { autoDetectPort, probePort } = require('./scale-auto-detect.cjs');

function buildPickerHtml() {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — весы</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 22px;
      background: #f1f5f9; color: #0f172a;
    }
    h1 { font-size: 1.15rem; margin: 0 0 6px; }
    p { margin: 0 0 12px; color: #475569; font-size: 0.85rem; line-height: 1.45; }
    .status { padding: 10px 12px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 12px; }
    .status.ok { background: #ecfdf5; color: #047857; }
    .status.err { background: #fef2f2; color: #991b1b; }
    .status.info { background: #eff6ff; color: #1d4ed8; }
    .list { display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; }
    .row {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px;
      background: #fff; cursor: pointer; font-size: 0.88rem;
    }
    .row.is-active { border-color: #0f766e; background: #ecfdf5; }
    .row .path { font-weight: 700; font-size: 0.95rem; }
    .row .meta { color: #64748b; font-size: 0.78rem; }
    label.field { display: block; margin: 12px 0 8px; font-size: 0.8rem; font-weight: 600; color: #475569; }
    select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    button {
      flex: 1; min-width: 120px; padding: 10px; border: none; border-radius: 10px;
      font-size: 0.9rem; font-weight: 600; cursor: pointer;
    }
    button.primary { background: #0f766e; color: #fff; }
    button.primary:disabled { background: #94a3b8; cursor: not-allowed; }
    button.secondary { background: #e2e8f0; color: #0f172a; }
    button.accent { background: #0284c7; color: #fff; flex: 1 1 100%; }
    .hint { font-size: 0.75rem; color: #64748b; margin-top: 10px; line-height: 1.4; }
  </style>
</head>
<body>
  <h1>Весы (COM-порт)</h1>
  <p>После установки драйвера Windows создаёт COM-порт. Нажмите «Найти автоматически» или выберите порт из списка.</p>
  <div id="status" class="status info">Загрузка…</div>
  <div id="content"></div>
  <label class="field">Скорость (baud)</label>
  <select id="baud">
    <option value="9600">9600</option>
    <option value="4800">4800</option>
    <option value="2400">2400</option>
    <option value="19200">19200</option>
  </select>
  <div class="actions">
    <button class="accent" id="auto">Найти автоматически</button>
    <button class="secondary" id="refresh">Обновить список</button>
    <button class="secondary" id="test">Проверить порт</button>
    <button class="primary" id="save" disabled>Сохранить</button>
    <button class="secondary" id="cancel">Закрыть</button>
  </div>
  <p class="hint">Сохранённый порт запоминается — при следующем запуске касса подключится сама. Меню Aurent → «Весы».</p>
  <script>
    const content = document.getElementById('content');
    const statusEl = document.getElementById('status');
    const baudEl = document.getElementById('baud');
    let ports = [];
    let selected = null;

    function setStatus(text, kind) {
      statusEl.textContent = text;
      statusEl.className = 'status ' + (kind || 'info');
    }

    function render() {
      if (!ports.length) {
        content.innerHTML = '<p style="color:#991b1b;font-size:0.9rem">COM-порты не найдены. Подключите весы по USB и проверьте драйвер в диспетчере устройств.</p>';
        document.getElementById('save').disabled = true;
        return;
      }
      content.innerHTML = '<div class="list">' + ports.map(p => {
        const active = selected === p.path ? ' is-active' : '';
        const meta = [p.manufacturer, p.friendlyName].filter(Boolean).join(' · ') || '—';
        return '<div class="row' + active + '" data-path="' + p.path + '">'
          + '<span class="path">' + p.path + '</span>'
          + '<span class="meta">' + meta + '</span></div>';
      }).join('') + '</div>';
      document.querySelectorAll('.row').forEach(el => {
        el.onclick = () => {
          selected = el.getAttribute('data-path');
          document.getElementById('save').disabled = !selected;
          render();
        };
      });
    }

    async function load() {
      setStatus('Загружаем COM-порты…', 'info');
      try {
        const data = await window.scalePicker.load();
        ports = data.ports || [];
        selected = data.currentPort || (ports[0] && ports[0].path) || null;
        if (data.baudRate) baudEl.value = String(data.baudRate);
        document.getElementById('save').disabled = !selected;
        if (data.serialError) {
          setStatus('Модуль serialport не установлен: ' + data.serialError, 'err');
        } else if (!ports.length) {
          setStatus('Порты не найдены', 'err');
        } else {
          setStatus('Выберите порт или нажмите «Найти автоматически»', 'info');
        }
        render();
      } catch (e) {
        setStatus('Ошибка: ' + (e?.message || e), 'err');
      }
    }

    document.getElementById('refresh').onclick = () => load();
    document.getElementById('cancel').onclick = () => window.scalePicker.cancel();

    document.getElementById('auto').onclick = async () => {
      setStatus('Ищем весы на COM-портах…', 'info');
      try {
        const r = await window.scalePicker.autoDetect();
        if (r.ok) {
          selected = r.port;
          if (r.baudRate) baudEl.value = String(r.baudRate);
          document.getElementById('save').disabled = false;
          setStatus('Найдено: ' + r.port + (r.reading ? ' (' + r.reading.kg + ' кг)' : ''), 'ok');
          await load();
        } else {
          setStatus(r.error || 'Не найдено', 'err');
        }
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    document.getElementById('test').onclick = async () => {
      if (!selected) { setStatus('Сначала выберите порт', 'err'); return; }
      setStatus('Проверка ' + selected + '…', 'info');
      try {
        const r = await window.scalePicker.testPort({ port: selected, baudRate: Number(baudEl.value) });
        if (r.ok && r.reading) {
          setStatus('Вес: ' + r.reading.kg + ' кг (' + (r.reading.stable ? 'стабилен' : 'нестабилен') + ')', 'ok');
        } else if (r.ok) {
          setStatus('Порт открыт. Положите товар на весы и повторите.', 'ok');
        } else {
          setStatus(r.error || 'Нет данных с весов', 'err');
        }
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    document.getElementById('save').onclick = async () => {
      if (!selected) return;
      try {
        await window.scalePicker.save({ port: selected, baudRate: Number(baudEl.value) });
      } catch (e) {
        setStatus(e?.message || String(e), 'err');
      }
    };

    load();
  </script>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function showScalePickerWindow(mainWindow) {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      ...windowIconOptions(),
      width: 480,
      height: 560,
      resizable: false,
      title: 'Aurent — весы',
      autoHideMenuBar: true,
      parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
      modal: Boolean(mainWindow && !mainWindow.isDestroyed()),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'scale-picker-preload.cjs'),
      },
    });

    let settled = false;
    const cleanupIpc = () => {
      ipcMain.removeHandler('scale-picker:load');
      ipcMain.removeHandler('scale-picker:save');
      ipcMain.removeHandler('scale-picker:auto-detect');
      ipcMain.removeHandler('scale-picker:test');
      ipcMain.removeAllListeners('scale-picker:cancel');
    };
    const finish = (value) => {
      if (settled) return;
      settled = true;
      cleanupIpc();
      if (!win.isDestroyed()) win.close();
      resolve(value);
    };

    ipcMain.handle('scale-picker:load', async () => {
      const settings = readScaleSettings();
      const listed = await listSerialPorts();
      return {
        ports: listed.ports,
        serialError: listed.error || null,
        currentPort: settings.port,
        baudRate: settings.baudRate,
      };
    });

    ipcMain.handle('scale-picker:save', (_e, payload) => {
      const port = String(payload?.port || '').trim();
      if (!port) throw new Error('Выберите COM-порт');
      const saved = writeScaleSettings({
        scalePort: port,
        scaleBaudRate: Number(payload?.baudRate) || 9600,
      });
      finish(saved);
      return saved;
    });

    ipcMain.handle('scale-picker:auto-detect', async () => {
      const baud = Number(readScaleSettings().baudRate) || 9600;
      return autoDetectPort({ save: true, baudRate: baud });
    });

    ipcMain.handle('scale-picker:test', async (_e, payload) => {
      const port = String(payload?.port || '').trim();
      const baudRate = Number(payload?.baudRate) || 9600;
      if (!port) throw new Error('Порт не указан');
      return probePort(port, baudRate, 3500);
    });

    ipcMain.on('scale-picker:cancel', () => finish(readScaleSettings()));

    win.on('closed', () => {
      if (!settled) {
        settled = true;
        cleanupIpc();
        resolve(readScaleSettings());
      }
    });

    win.loadURL(buildPickerHtml()).catch((err) => {
      if (!settled) {
        settled = true;
        cleanupIpc();
        reject(err);
      }
    });
  });
}

module.exports = { showScalePickerWindow };

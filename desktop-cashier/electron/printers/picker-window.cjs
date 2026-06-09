const path = require('path');
const { BrowserWindow, ipcMain } = require('electron');
const { windowIconOptions } = require('../core/window-icon.cjs');
const { readPrinterSettings, writePrinterSettings } = require('../core/config.cjs');

const KIND_META = {
  receipt: {
    field: 'receiptPrinterName',
    title: 'Принтер чека',
    hint:
      'Выберите принтер из списка (имя как в Windows) и нажмите «Сохранить». ' +
      'Чеки после продажи будут печататься на нём автоматически. ' +
      'Сменить позже: меню Aurent → «Принтер чека».',
  },
  label: {
    field: 'labelPrinterName',
    title: 'Принтер штрих-кодов / этикеток',
    hint:
      'Выберите принтер и нажмите «Сохранить». ' +
      'Сменить позже: меню Aurent → «Принтер штрих-кодов».',
  },
};

function metaFor(kind) {
  return KIND_META[kind] || KIND_META.receipt;
}

function buildPickerHtml(meta) {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Aurent — ${meta.title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 22px;
      background: #f1f5f9; color: #0f172a;
    }
    h1 { font-size: 1.15rem; margin: 0 0 6px; }
    p { margin: 0 0 14px; color: #475569; font-size: 0.85rem; line-height: 1.4; }
    .empty { padding: 18px; background: #fef2f2; color: #991b1b; border-radius: 10px; font-size: 0.9rem; }
    .list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
    .row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px;
      background: #fff; cursor: pointer; font-size: 0.92rem;
    }
    .row.is-active { border-color: #0f766e; background: #ecfdf5; }
    .row .name { flex: 1; font-weight: 600; }
    .badge { font-size: 0.7rem; color: #0f766e; background: #d1fae5; padding: 2px 6px; border-radius: 999px; }
    .actions { display: flex; gap: 10px; margin-top: 16px; }
    button {
      flex: 1; padding: 11px; border: none; border-radius: 10px;
      font-size: 0.95rem; font-weight: 600; cursor: pointer;
    }
    button.primary { background: #0f766e; color: #fff; }
    button.primary:disabled { background: #94a3b8; cursor: not-allowed; }
    button.primary:hover:not(:disabled) { background: #0d9488; }
    button.secondary { background: #e2e8f0; color: #0f172a; }
    button.secondary:hover { background: #cbd5e1; }
    .hint { font-size: 0.75rem; color: #64748b; margin-top: 10px; line-height: 1.4; }
  </style>
</head>
<body>
  <h1>${meta.title}</h1>
  <p>${meta.hint}</p>
  <div id="content"><p class="hint">Загружаем список принтеров…</p></div>
  <p class="hint">Если нужного принтера нет в списке — подключите его и нажмите «Обновить».</p>
  <script>
    const content = document.getElementById('content');
    let selected = null;
    let printers = [];

    function render() {
      if (!printers.length) {
        content.innerHTML = '<div class="empty">В системе нет ни одного принтера. Подключите принтер и нажмите «Обновить».</div>'
          + '<div class="actions">'
          + '<button class="secondary" id="refresh">Обновить</button>'
          + '<button class="secondary" id="cancel">Закрыть</button>'
          + '</div>';
        document.getElementById('refresh').onclick = load;
        document.getElementById('cancel').onclick = () => window.printerPicker.cancel();
        return;
      }
      const rows = printers
        .map((p) => {
          const isActive = p.name === selected ? ' is-active' : '';
          const badge = p.isDefault ? '<span class="badge">по умолчанию</span>' : '';
          const display = (p.displayName && p.displayName !== p.name)
            ? p.displayName + ' (' + p.name + ')'
            : p.name;
          return '<div class="row' + isActive + '" data-name="' + p.name + '">'
            + '<span class="name">' + display + '</span>'
            + badge
            + '</div>';
        })
        .join('');
      content.innerHTML = '<div class="list">' + rows + '</div>'
        + '<div class="actions">'
        + '<button class="secondary" id="refresh">Обновить</button>'
        + '<button class="primary" id="save" disabled>Сохранить</button>'
        + '</div>';
      content.querySelectorAll('.row').forEach((row) => {
        row.addEventListener('click', () => {
          selected = row.getAttribute('data-name');
          render();
        });
      });
      document.getElementById('refresh').onclick = load;
      const saveBtn = document.getElementById('save');
      saveBtn.disabled = !selected;
      saveBtn.onclick = () => {
        if (selected) {
          window.printerPicker.save(selected);
        }
      };
    }

    async function load() {
      content.innerHTML = '<p class="hint">Загружаем список принтеров…</p>';
      try {
        const data = await window.printerPicker.load();
        printers = Array.isArray(data?.printers) ? data.printers : [];
        if (!selected) {
          const fromSettings = data?.current;
          const defaultPrinter = printers.find((p) => p.isDefault);
          selected = fromSettings || (defaultPrinter ? defaultPrinter.name : (printers[0]?.name || null));
        }
        render();
      } catch (e) {
        content.innerHTML = '<div class="empty">Не удалось получить список принтеров: ' + (e?.message || e) + '</div>';
      }
    }

    load();
  </script>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function showPrinterPickerWindow(mainWindow, options = {}) {
  const kind = options.kind === 'label' ? 'label' : 'receipt';
  const meta = metaFor(kind);

  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      ...windowIconOptions(),
      width: 460,
      height: 480,
      resizable: false,
      title: `Aurent — ${meta.title}`,
      autoHideMenuBar: true,
      parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
      modal: Boolean(mainWindow && !mainWindow.isDestroyed()),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'picker-preload.cjs'),
      },
    });

    let settled = false;
    const cleanupIpc = () => {
      ipcMain.removeHandler('printer-picker:load');
      ipcMain.removeHandler('printer-picker:save');
      ipcMain.removeAllListeners('printer-picker:cancel');
    };
    const finish = (value) => {
      if (settled) return;
      settled = true;
      cleanupIpc();
      if (!win.isDestroyed()) {
        win.close();
      }
      resolve(value);
    };

    ipcMain.handle('printer-picker:load', async () => {
      const wc = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : win.webContents;
      let printers = [];
      try {
        printers = await wc.getPrintersAsync();
      } catch {
        printers = [];
      }
      const current = readPrinterSettings()[meta.field] || '';
      return { printers, current };
    });

    ipcMain.handle('printer-picker:save', (_e, name) => {
      const trimmed = String(name || '').trim();
      if (!trimmed) {
        throw new Error('Выберите принтер из списка');
      }
      const saved = writePrinterSettings({ [meta.field]: trimmed });
      finish(saved);
      return saved;
    });

    ipcMain.on('printer-picker:cancel', () => {
      finish(readPrinterSettings());
    });

    win.on('closed', () => {
      if (!settled) {
        settled = true;
        cleanupIpc();
        resolve(readPrinterSettings());
      }
    });

    win.loadURL(buildPickerHtml(meta)).catch((err) => {
      if (!settled) {
        settled = true;
        cleanupIpc();
        reject(err);
      }
    });
  });
}

module.exports = { showPrinterPickerWindow };

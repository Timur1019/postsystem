const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let configured = false;

function buildUpdateFeedUrl(cashierUrl) {
  try {
    const origin = new URL(String(cashierUrl || '')).origin;
    if (!origin || origin.includes('127.0.0.1') || origin.includes('localhost')) {
      return null;
    }
    return `${origin.replace(/\/$/, '')}/downloads/desktop/`;
  } catch {
    return null;
  }
}

function shouldCheckUpdates() {
  return app.isPackaged && process.env.POS_SKIP_AUTO_UPDATE !== '1';
}

function setupAutoUpdater({ getMainWindow, getCashierUrl }) {
  if (!shouldCheckUpdates() || configured) {
    return;
  }
  configured = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    const win = getMainWindow?.();
    if (win && !win.isDestroyed()) {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Aurent — обновление',
        message: `Доступна новая версия ${info.version}`,
        detail: 'Загрузка началась автоматически. После загрузки будет предложено перезапустить приложение.',
        buttons: ['OK'],
      }).catch(() => {});
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    const win = getMainWindow?.();
    const buttons = ['Перезапустить', 'Позже'];
    const opts = {
      type: 'info',
      title: 'Aurent — обновление готово',
      message: `Версия ${info.version} загружена`,
      detail: 'Перезапустите кассу, чтобы применить обновление.',
      buttons,
      defaultId: 0,
      cancelId: 1,
    };
    const promise = win && !win.isDestroyed()
      ? dialog.showMessageBox(win, opts)
      : dialog.showMessageBox(opts);
    promise.then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    }).catch(() => {});
  });

  autoUpdater.on('error', (err) => {
    if (process.env.POS_DEBUG_UPDATE === '1') {
      console.error('[Aurent auto-update]', err?.message || err);
    }
  });

  const feedUrl = buildUpdateFeedUrl(getCashierUrl?.());
  if (feedUrl) {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl });
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 8000);
  }
}

async function checkForUpdatesNow(cashierUrl) {
  if (!shouldCheckUpdates()) {
    return { ok: false, reason: 'dev' };
  }
  const feedUrl = buildUpdateFeedUrl(cashierUrl);
  if (!feedUrl) {
    return { ok: false, reason: 'no-feed' };
  }
  autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl });
  try {
    const result = await autoUpdater.checkForUpdates();
    const current = app.getVersion();
    const latest = result?.updateInfo?.version;
    if (latest && latest !== current) {
      return { ok: true, updateAvailable: true, version: latest };
    }
    return { ok: true, updateAvailable: false, version: current };
  } catch (err) {
    return { ok: false, reason: err?.message || 'error' };
  }
}

module.exports = {
  buildUpdateFeedUrl,
  setupAutoUpdater,
  checkForUpdatesNow,
  shouldCheckUpdates,
};

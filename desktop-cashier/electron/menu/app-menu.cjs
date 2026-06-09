const { Menu, dialog } = require('electron');
const { checkForUpdatesNow } = require('../updates/auto-update.cjs');
const { reloadCashierPage, openServerSettings } = require('../window/cashier-session.cjs');
const state = require('../bootstrap/state.cjs');

function buildAppMenuTemplate() {
  return [
    {
      label: 'Aurent',
      submenu: [{ role: 'quit', label: 'Выход' }],
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Настройка сервера…',
          accelerator: 'CmdOrCtrl+,',
          click: () => openServerSettings(),
        },
        { type: 'separator' },
        {
          label: 'Проверить обновления…',
          click: () => {
            const config = state.getConfig();
            checkForUpdatesNow(config?.cashierUrl).then((result) => {
              if (result.updateAvailable) {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'Aurent — обновление',
                  message: `Доступна версия ${result.version}`,
                  detail: 'Загрузка начнётся автоматически.',
                  buttons: ['OK'],
                }).catch(() => {});
              } else if (result.ok) {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'Aurent — обновление',
                  message: 'Установлена последняя версия',
                  buttons: ['OK'],
                }).catch(() => {});
              } else if (result.reason !== 'dev') {
                dialog.showMessageBox({
                  type: 'warning',
                  title: 'Aurent — обновление',
                  message: 'Не удалось проверить обновления',
                  detail: String(result.reason || ''),
                  buttons: ['OK'],
                }).catch(() => {});
              }
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Обновить',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            reloadCashierPage().catch((err) => {
              console.error('[Aurent] reload failed:', err?.message || err);
            });
          },
        },
        { role: 'togglefullscreen', label: 'На весь экран' },
      ],
    },
  ];
}

function buildAppMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildAppMenuTemplate()));
}

module.exports = { buildAppMenu };

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  /** Тихая печать по номеру чека (скрытое окно). */
  printReceipt: (receiptNumber) => ipcRenderer.invoke('print-receipt', receiptNumber),
  /** Тихая печать текущей страницы чека (без диалога). */
  printCurrentPage: () => ipcRenderer.invoke('print-current-page'),
  openServerSetup: () => ipcRenderer.invoke('desktop:open-server-setup'),
  reload: () => ipcRenderer.invoke('desktop:reload'),
  toggleFullscreen: () => ipcRenderer.invoke('desktop:toggle-fullscreen'),
  quit: () => ipcRenderer.invoke('desktop:quit'),
});

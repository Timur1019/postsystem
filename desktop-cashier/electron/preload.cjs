const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  /** Тихая печать чека (без диалога и без перехода с кассы). */
  printReceipt: (receiptNumber) => ipcRenderer.invoke('print-receipt', receiptNumber),
});

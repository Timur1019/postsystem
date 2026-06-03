const { contextBridge, ipcRenderer } = require('electron');

/**
 * Десктоп API для веб-кассы.
 * Чеки и X/Z — window.print() на фронте (как в браузере).
 * Electron: выбор принтера, этикетки, обновления, настройка сервера.
 */
contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  getCompanyLoginCode: () => ipcRenderer.invoke('desktop:get-company-login-code'),
  printReceiptAuto: (payload) => ipcRenderer.invoke('desktop:print-receipt-auto', payload),
  printLabelPage: () => ipcRenderer.invoke('print-label-page'),
  openServerSetup: () => ipcRenderer.invoke('desktop:open-server-setup'),
  reload: () => ipcRenderer.invoke('desktop:reload'),
  toggleFullscreen: () => ipcRenderer.invoke('desktop:toggle-fullscreen'),
  prepareForPrint: () => ipcRenderer.invoke('desktop:prepare-for-print'),
  quit: () => ipcRenderer.invoke('desktop:quit'),

  listPrinters: () => ipcRenderer.invoke('desktop:list-printers'),
  getPrinterSettings: () => ipcRenderer.invoke('desktop:get-printer-settings'),
  setPrinterSettings: (settings) => ipcRenderer.invoke('desktop:set-printer-settings', settings),
  openPrinterPicker: () => ipcRenderer.invoke('desktop:open-printer-picker'),
  openLabelPrinterPicker: () => ipcRenderer.invoke('desktop:open-label-printer-picker'),
  openBarcodePage: () => ipcRenderer.invoke('desktop:open-barcode-page'),
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-updates'),
});

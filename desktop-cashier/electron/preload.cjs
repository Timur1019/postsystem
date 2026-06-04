const { contextBridge, ipcRenderer } = require('electron');

/**
 * Десктоп API для веб-кассы.
 * Чеки, отчёты, этикетки — ESC/POS в main process; браузер — window.print().
 */
contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  getCompanyLoginCode: () => ipcRenderer.invoke('desktop:get-company-login-code'),
  printLabelPage: () => ipcRenderer.invoke('print-label-page'),
  printReceiptEscpos: (payload) => ipcRenderer.invoke('desktop:print-receipt-escpos', payload),
  printZReportEscpos: (payload) => ipcRenderer.invoke('desktop:print-z-report-escpos', payload),
  printShiftReportEscpos: (payload) => ipcRenderer.invoke('desktop:print-shift-report-escpos', payload),
  printLabelsEscpos: (payload) => ipcRenderer.invoke('desktop:print-label-escpos', payload),
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

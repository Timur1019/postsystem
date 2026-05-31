const { contextBridge, ipcRenderer } = require('electron');

/**
 * Десктоп API для веб-кассы.
 * Печать: рендер → ipcRenderer.invoke → main → скрытое окно → webContents.print({ silent: true }).
 * На фронте не вызывать window.print() — только методы ниже.
 */
contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  /** Тихая / диалоговая печать из JSON продажи. options.autoPrint=true — после продажи. */
  printReceiptSale: (sale, options) => ipcRenderer.invoke('print-receipt-sale', sale, options || {}),
  /** Диалог печати чека из JSON (Windows POS-80, если тихая печать не сработала). */
  printReceiptSaleDialog: (sale) => ipcRenderer.invoke('print-receipt-sale-dialog', sale),
  printReceipt: (receiptNumber) => ipcRenderer.invoke('print-receipt', receiptNumber),
  printReceiptHtml: (bodyHtml) => ipcRenderer.invoke('print-receipt-html', bodyHtml),
  printShiftReport: (report) => ipcRenderer.invoke('print-shift-report', report),
  /** @deprecated Не печатать текущую страницу — используйте printReceiptSale */
  printCurrentPage: () => ipcRenderer.invoke('print-current-page'),
  printLabelPage: () => ipcRenderer.invoke('print-label-page'),
  openServerSetup: () => ipcRenderer.invoke('desktop:open-server-setup'),
  reload: () => ipcRenderer.invoke('desktop:reload'),
  toggleFullscreen: () => ipcRenderer.invoke('desktop:toggle-fullscreen'),
  quit: () => ipcRenderer.invoke('desktop:quit'),

  listPrinters: () => ipcRenderer.invoke('desktop:list-printers'),
  getPrinterSettings: () => ipcRenderer.invoke('desktop:get-printer-settings'),
  setPrinterSettings: (settings) => ipcRenderer.invoke('desktop:set-printer-settings', settings),
  openPrinterPicker: () => ipcRenderer.invoke('desktop:open-printer-picker'),
  openLabelPrinterPicker: () => ipcRenderer.invoke('desktop:open-label-printer-picker'),
  printTestReceipt: () => ipcRenderer.invoke('desktop:print-test-receipt'),
  openBarcodePage: () => ipcRenderer.invoke('desktop:open-barcode-page'),
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-updates'),
});

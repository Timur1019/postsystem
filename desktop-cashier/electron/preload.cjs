const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  /** Тихая / диалоговая печать из JSON продажи. options.autoPrint=true — после продажи. */
  printReceiptSale: (sale, options) => ipcRenderer.invoke('print-receipt-sale', sale, options || {}),
  /** Диалог печати чека из JSON (Windows POS-80, если тихая печать пустая). */
  printReceiptSaleDialog: (sale) => ipcRenderer.invoke('print-receipt-sale-dialog', sale),
  /** Тихая печать по номеру чека (скрытое окно /receipt). */
  printReceipt: (receiptNumber) => ipcRenderer.invoke('print-receipt', receiptNumber),
  /** Тихая печать готового HTML чека (скрытое окно). */
  printReceiptHtml: (bodyHtml) => ipcRenderer.invoke('print-receipt-html', bodyHtml),
  /** X/Z-отчёт смены — скрытое окно Electron (не window.print). */
  printShiftReport: (report) => ipcRenderer.invoke('print-shift-report', report),
  /** @deprecated Используйте printReceipt / printReceiptHtml */
  printCurrentPage: () => ipcRenderer.invoke('print-current-page'),
  /** Тихая печать текущей страницы как этикетки/штрих-кода. */
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

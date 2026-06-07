const { contextBridge, ipcRenderer } = require('electron');

/**
 * Десктоп API для веб-кассы.
 * Чеки, отчёты, этикетки — ESC/POS в main process; браузер — window.print().
 */
contextBridge.exposeInMainWorld('desktopCashier', {
  isDesktop: true,
  getCompanyLoginCode: () => ipcRenderer.invoke('desktop:get-company-login-code'),
  getApiBaseUrl: () => ipcRenderer.invoke('desktop:get-api-base-url'),
  printLabelPage: (opts) => ipcRenderer.invoke('print-label-page', opts || {}),
  printReceiptEscpos: (payload) => ipcRenderer.invoke('desktop:print-receipt-escpos', payload),
  printZReportEscpos: (payload) => ipcRenderer.invoke('desktop:print-z-report-escpos', payload),
  printShiftReportEscpos: (payload) => ipcRenderer.invoke('desktop:print-shift-report-escpos', payload),
  printLabelsEscpos: (payload) => ipcRenderer.invoke('desktop:print-label-escpos', payload),
  printLabelTspl: (payload) => ipcRenderer.invoke('desktop:print-label-tspl', payload),
  labelTsplGetSettings: () => ipcRenderer.invoke('desktop:label-tspl-get-settings'),
  labelTsplSetSettings: (patch) => ipcRenderer.invoke('desktop:label-tspl-set-settings', patch),
  labelTsplAutoDetect: (opts) => ipcRenderer.invoke('desktop:label-tspl-auto-detect', opts || {}),
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

  scaleIsAvailable: () => ipcRenderer.invoke('desktop:scale-is-available'),
  scaleStatus: () => ipcRenderer.invoke('desktop:scale-status'),
  scaleListPorts: () => ipcRenderer.invoke('desktop:scale-list-ports'),
  scaleGetSettings: () => ipcRenderer.invoke('desktop:scale-get-settings'),
  scaleSetSettings: (patch) => ipcRenderer.invoke('desktop:scale-set-settings', patch),
  scaleStart: () => ipcRenderer.invoke('desktop:scale-start'),
  scaleStop: () => ipcRenderer.invoke('desktop:scale-stop'),
  scaleCapture: () => ipcRenderer.invoke('desktop:scale-capture'),
  onScaleWeight: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop:scale-weight', listener);
    return () => ipcRenderer.removeListener('desktop:scale-weight', listener);
  },
  openScalePicker: () => ipcRenderer.invoke('desktop:open-scale-picker'),
  scaleAutoDetect: (opts) => ipcRenderer.invoke('desktop:scale-auto-detect', opts || {}),

  offlineGetStatus: () => ipcRenderer.invoke('offline:get-status'),
  offlineImportBootstrap: (payload) => ipcRenderer.invoke('offline:import-bootstrap', payload),
  offlineListCategories: () => ipcRenderer.invoke('offline:list-categories'),
  offlineSearchProducts: (opts) => ipcRenderer.invoke('offline:search-products', opts || {}),
  offlineGetProductByBarcode: (barcode) =>
    ipcRenderer.invoke('offline:get-product-by-barcode', barcode),
  offlineGetCurrentShift: (payload) => ipcRenderer.invoke('offline:get-current-shift', payload),
  offlineOpenShift: (payload) => ipcRenderer.invoke('offline:open-shift', payload),
  offlineSyncShiftFromServer: (payload) =>
    ipcRenderer.invoke('offline:sync-shift-from-server', payload),
  offlineSaveSale: (payload) => ipcRenderer.invoke('offline:save-sale', payload),
  offlineListPendingSales: () => ipcRenderer.invoke('offline:list-pending-sales'),
  offlineListMySales: (opts) => ipcRenderer.invoke('offline:list-my-sales', opts || {}),
  offlineMarkSalesSynced: (results) => ipcRenderer.invoke('offline:mark-sales-synced', results),
  offlineDecreaseStock: (payload) => ipcRenderer.invoke('offline:decrease-stock', payload),
  onOfflineConnectivity: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('offline:connectivity', listener);
    return () => ipcRenderer.removeListener('offline:connectivity', listener);
  },
});

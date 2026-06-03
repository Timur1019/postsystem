/**
 * Конфиг печати фискального чека (диалог / страница / модалка).
 */

export const RECEIPT_PRINT_DOM = Object.freeze({
  fiscalPrintShellId: 'fiscal-print-shell',
  receiptPrintAreaId: 'receipt-print-area',
  printJobPageStyleId: 'pos-print-job-page',
  testPrintHostId: 'aurent-test-receipt-print-host',
  qrImageSelector: '.receipt-qr',
  fiscalPrintDialogClass: 'fiscal-print-dialog',
  printRootSelectors: Object.freeze([
    '#fiscal-print-shell',
    '#receipt-print-area',
    '.receipt-print-root',
  ]),
});

export const RECEIPT_PRINT_ENGINE = Object.freeze({
  domReadyPollIntervalMs: 100,
  domReadyMaxAttempts: 60,
  paintSettleMs: 120,
});

export const RECEIPT_PRINT_THRESHOLDS = Object.freeze({
  fiscalMinTextLength: 80,
  fiscalMinHeightPx: 120,
  shiftReportMinTextLength: 12,
  shiftReportMinHeightPx: 40,
});

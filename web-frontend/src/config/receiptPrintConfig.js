/**
 * Конфиг печати фискального чека (касса + Electron).
 *
 * Один DOM: #pos-auto-print-print-host — на экране компактно, в принтер полный размер.
 */

export const RECEIPT_PRINT_DOM = Object.freeze({
  bodyPrintHostId: 'pos-auto-print-print-host',
  /** Клон для принтера (off-screen), экранный host не трогаем */
  capturePrintHostId: 'pos-auto-print-print-host-capture',
  fiscalPrintShellId: 'fiscal-print-shell',
  receiptPrintAreaId: 'receipt-print-area',
  printJobPageStyleId: 'pos-print-job-page',
  testPrintHostId: 'aurent-test-receipt-print-host',
  qrImageSelector: '.receipt-qr',
  fiscalPrintDialogClass: 'fiscal-print-dialog',
  autoPrintHostClass: 'pos-auto-print-host',
  staleDomIds: Object.freeze([
    'pos-auto-print-preview-mount',
    'pos-auto-print-mount',
    'pos-auto-print-slot',
    'pos-auto-print-print-support-lane',
    'pos-auto-print-handbook-print-area',
    'pos-auto-print-handbook-print-slot',
  ]),
  printRootSelectors: Object.freeze([
    '#fiscal-print-shell',
    '#receipt-print-area',
    '.receipt-print-root',
  ]),
});

export const RECEIPT_AUTO_PRINT_UI = Object.freeze({
  qrWaitMaxMs: 4000,
  qrPollIntervalMs: 100,
  qrShellMissingPollMs: 80,
  beforePrintSettleMs: 180,
  previewHoldAfterPrintMs: 0,
  strictModeUnmountDelayMs: 280,
});

export const RECEIPT_PRINT_ENGINE = Object.freeze({
  domReadyPollIntervalMs: 100,
  domReadyMaxAttempts: 60,
  paintSettleMs: 120,
  preSilentInvokeDelayMs: 150,
  silentMaxAttempts: 2,
  silentRetryBackoffBaseMs: 350,
  captureSettleMs: 80,
  captureReleaseDelayMs: 60,
  bodyImageWaitMaxMs: 2500,
});

export const RECEIPT_PRINT_THRESHOLDS = Object.freeze({
  fiscalMinTextLength: 80,
  fiscalMinHeightPx: 120,
  shiftReportMinTextLength: 12,
  shiftReportMinHeightPx: 40,
});

export const RECEIPT_PRINT_TOAST = Object.freeze({
  toastId: 'pos-auto-print',
  successDurationMs: 3000,
  errorDurationMs: 6000,
});

export const RECEIPT_PRINT_STYLES = Object.freeze({
  hostBodyPrintClass: 'pos-auto-print-host--body-print',
  /** Компактный чек по центру (экран) */
  hostOnScreenClass: 'pos-auto-print-host--on-screen',
  /** На время IPC — полная ширина 80mm, без уезда за экран */
  hostPrintingClass: 'pos-auto-print-host--printing',
  /** До готовности QR/DOM — превью не показываем (нет пустой вспышки) */
  hostPreparingClass: 'pos-auto-print-host--preparing',
});

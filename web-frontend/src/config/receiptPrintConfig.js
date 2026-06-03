/**
 * Конфиг печати фискального чека (касса + Electron).
 *
 * Экран: #pos-auto-print-print-host — маленький чек в углу, виден до конца печати.
 * Принтер: #pos-auto-print-print-host-capture — невидимый клон off-screen.
 */

export const RECEIPT_PRINT_DOM = Object.freeze({
  bodyPrintHostId: 'pos-auto-print-print-host',
  /** Клон для принтера (off-screen), экранный host не трогаем */
  capturePrintHostId: 'pos-auto-print-print-host-capture',
  fiscalPrintShellId: 'fiscal-print-shell',
  /** Клон shell в capture-host (отдельный id — не путается с экранным) */
  captureFiscalShellId: 'fiscal-print-shell-capture',
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
  qrWaitMaxMs: 6000,
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
  preSilentInvokeDelayMs: 280,
  silentMaxAttempts: 3,
  silentRetryBackoffBaseMs: 400,
  captureSettleMs: 200,
  captureReadyMaxMs: 4000,
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
  /** Маленький чек в углу экрана */
  hostOnScreenClass: 'pos-auto-print-host--on-screen',
  /** Off-screen клон для принтера */
  hostPrintingClass: 'pos-auto-print-host--printing',
});

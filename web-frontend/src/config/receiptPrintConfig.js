/**
 * Конфиг печати фискального чека (касса + Electron).
 *
 * Поток: PosPage → AutoPrintManager → print-host (body) + screen preview → silent print.
 */

/** Id DOM и селекторы */
export const RECEIPT_PRINT_DOM = Object.freeze({
  previewMountId: 'pos-auto-print-preview-mount',
  previewShellId: 'fiscal-print-shell-live',
  fiscalPrintShellId: 'fiscal-print-shell',
  bodyPrintHostId: 'pos-auto-print-print-host',
  receiptPrintAreaId: 'receipt-print-area',
  printJobPageStyleId: 'pos-print-job-page',
  testPrintHostId: 'aurent-test-receipt-print-host',
  qrImageSelector: '.receipt-qr',
  fiscalPrintDialogClass: 'fiscal-print-dialog',
  autoPrintHostClass: 'pos-auto-print-host',
  /** Удаляются при teardown (старые версии UI) */
  staleDomIds: Object.freeze([
    'pos-auto-print-mount',
    'pos-auto-print-slot',
    'pos-auto-print-print-support-lane',
    'pos-auto-print-handbook-print-area',
    'pos-auto-print-handbook-print-slot',
  ]),
  printRootSelectors: Object.freeze([
    '#fiscal-print-shell-live',
    '#fiscal-print-shell',
    '#receipt-print-area',
    '.receipt-print-root',
  ]),
});

/** AutoPrintManager — после продажи */
export const RECEIPT_AUTO_PRINT_UI = Object.freeze({
  qrWaitMaxMs: 4000,
  qrPollIntervalMs: 100,
  qrShellMissingPollMs: 80,
  beforePrintSettleMs: 550,
  previewHoldAfterPrintMs: 2200,
  strictModeUnmountDelayMs: 280,
});

/** printReceipt.js — silent print / ретраи */
export const RECEIPT_PRINT_ENGINE = Object.freeze({
  domReadyPollIntervalMs: 100,
  domReadyMaxAttempts: 60,
  paintSettleMs: 350,
  preSilentInvokeDelayMs: 400,
  silentMaxAttempts: 2,
  silentRetryBackoffBaseMs: 350,
  captureSettleMs: 120,
  captureReleaseDelayMs: 80,
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

/** Классы host — styles/receipt-auto-print.css */
export const RECEIPT_PRINT_STYLES = Object.freeze({
  hostBodyPrintClass: 'pos-auto-print-host--body-print',
  hostScreenPreviewClass: 'pos-auto-print-host--screen-preview',
  hostCapturingClass: 'pos-auto-print-host--capturing',
});

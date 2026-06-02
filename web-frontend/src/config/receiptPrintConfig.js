/**
 * Конфиг автопечати фискального чека (касса + Electron).
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  PosSaleAutoPrint  →  RECEIPT_AUTO_PRINT_UI                 │
 * │  printReceipt.js   →  RECEIPT_PRINT_ENGINE + THRESHOLDS     │
 * │  autoPrintMount.js →  RECEIPT_PRINT_DOM                     │
 * │  receipt-auto-print.css → RECEIPT_PRINT_STYLES (CSS vars)  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Тайминги и пороги менять только здесь.
 */

/** Id элементов и селекторы DOM */
export const RECEIPT_PRINT_DOM = Object.freeze({
  autoPrintMountId: 'pos-auto-print-mount',
  autoPrintSlotId: 'pos-auto-print-slot',
  /** Превью в слоте (React). Electron не использует — только для экрана. */
  previewShellId: 'fiscal-print-shell-live',
  /** Единственный #fiscal-print-shell на body — только для silent print / Electron. */
  fiscalPrintShellId: 'fiscal-print-shell',
  bodyPrintHostId: 'pos-auto-print-print-host',
  receiptPrintAreaId: 'receipt-print-area',
  printJobPageStyleId: 'pos-print-job-page',
  testPrintHostId: 'aurent-test-receipt-print-host',
  qrImageSelector: '.receipt-qr',
  printRootSelectors: Object.freeze([
    '#fiscal-print-shell-live',
    '#fiscal-print-shell',
    '#pos-sale-print-shell',
    '.cashier-sales-receipt-pane__card',
  ]),
  fiscalPrintDialogClass: 'fiscal-print-dialog',
  autoPrintHostClass: 'pos-auto-print-host',
});

/**
 * Этап 1 — React-комponent PosSaleAutoPrint (сразу после продажи).
 * Отрисовка превью в правом слоте → ожидание QR → старт printThermalReceiptAuto.
 */
export const RECEIPT_AUTO_PRINT_UI = Object.freeze({
  /** Макс. ожидание QR; выход раньше, если img.receipt-qr уже загружен */
  qrWaitMaxMs: 2000,
  qrPollIntervalMs: 100,
  /** Если #fiscal-print-shell ещё не в DOM (StrictMode remount) */
  qrShellMissingPollMs: 80,
  /**
   * Пауза после layout/QR перед вызовом printThermalReceiptAuto.
   * Меньше → быстрее, но выше риск ретраев Electron (3 попытки, мигание).
   */
  beforePrintSettleMs: 450,
  /** React StrictMode: отложенный unmount при двойном mount */
  strictModeUnmountDelayMs: 280,
  defaultUnmountDelayMs: 200,
});

/**
 * Этап 2 — printReceipt.js (подготовка DOM, silent print, ретраи).
 */
export const RECEIPT_PRINT_ENGINE = Object.freeze({
  domReadyPollIntervalMs: 100,
  domReadyMaxAttempts: 60,
  /** Два rAF + пауза — «кадр отрисован» перед IPC */
  paintSettleMs: 350,
  /** Доп. пауза после paintSettle перед invokeDesktopSilentPrint */
  preSilentInvokeDelayMs: 400,
  silentMaxAttempts: 3,
  /** Пауза между ретраями: baseMs * номер попытки */
  silentRetryBackoffBaseMs: 350,
  /** withElectronPrintCapture: пауза после класса electron-print-capturing */
  captureSettleMs: 120,
  captureReleaseDelayMs: 80,
});

/** Когда считаем, что чек «готов» (текст, высота, картинки) */
export const RECEIPT_PRINT_THRESHOLDS = Object.freeze({
  fiscalMinTextLength: 80,
  fiscalMinHeightPx: 120,
  shiftReportMinTextLength: 12,
  shiftReportMinHeightPx: 40,
});

/** Toast после автопечати */
export const RECEIPT_PRINT_TOAST = Object.freeze({
  toastId: 'pos-auto-print',
  successDurationMs: 3000,
  errorDurationMs: 6000,
});

/**
 * CSS автопечати — styles/receipt-auto-print.css
 * Классы на <html> (printWithHtmlClass.js): print-thermal-modal, electron-auto-print-job, …
 * BEM слота: .pos-auto-print-slot, .pos-auto-print-host--embedded
 *
 * CSS-переменные (менять в :root файла стилей):
 *   --receipt-auto-print-preview-scale   масштаб превью в слоте
 *   --receipt-auto-print-slot-radius     скругление белого блока
 *   --receipt-auto-print-offscreen-left  позиция body-mount для Electron
 */
export const RECEIPT_PRINT_STYLES = Object.freeze({
  file: 'styles/receipt-auto-print.css',
  cssVars: Object.freeze({
    previewScale: '--receipt-auto-print-preview-scale',
    slotRadius: '--receipt-auto-print-slot-radius',
    slotBg: '--receipt-auto-print-slot-bg',
    offscreenLeft: '--receipt-auto-print-offscreen-left',
    bodyWidth: '--receipt-auto-print-body-width',
  }),
  slotWrapClass: 'pos-auto-print-slot-wrap',
  slotClass: 'pos-auto-print-slot',
  hostEmbeddedClass: 'pos-auto-print-host--embedded',
  hostInSlotClass: 'pos-auto-print-host--in-slot',
  hostBodyPrintClass: 'pos-auto-print-host--body-print',
});

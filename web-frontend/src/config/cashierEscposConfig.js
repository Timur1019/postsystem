/**
 * Конфиг автопечати чека ESC/POS (только desktop-cashier).
 * Не смешивать с printReceipt.js (window.print) и printShelfLabel.js.
 */

export const CASHIER_ESCPOS_IPC = 'desktop:print-receipt-escpos';

export const CASHIER_ESCPOS_TOAST = Object.freeze({
  toastId: 'cashier-escpos-print',
  successDurationMs: 3000,
  errorDurationMs: 6000,
});

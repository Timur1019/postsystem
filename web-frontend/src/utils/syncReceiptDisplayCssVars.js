// src/utils/syncReceiptDisplayCssVars.js
export const RECEIPT_LOGO_HEIGHT_DEFAULT_MM = 32;
export const RECEIPT_LOGO_HEIGHT_MIN_MM = 12;
export const RECEIPT_LOGO_HEIGHT_MAX_MM = 48;

/** CSS-переменные для логотипа на фискальном чеке. */
export function syncReceiptDisplayCssVars(state) {
  if (typeof document === 'undefined') return;
  const mm = Number(state?.receiptLogoMaxHeightMm) || RECEIPT_LOGO_HEIGHT_DEFAULT_MM;
  document.documentElement.style.setProperty('--print-logo-max-h', `${mm}mm`);
}

import { cleanupDesktopPrintState, clearReceiptPrintCaptureOverrides } from './printReceipt';

const HTML_UI_CLASSES = [
  'pos-pay-screen-open',
  'print-thermal-only',
  'print-thermal-modal',
  'electron-silent-print',
  'electron-print-capturing',
  'electron-silent-label',
  'shelflabel-printing-active',
];

export function resetCashierDocumentUiState() {
  if (typeof document === 'undefined') return;

  clearReceiptPrintCaptureOverrides();

  HTML_UI_CLASSES.forEach((cls) => {
    document.documentElement.classList.remove(cls);
    document.body?.classList.remove(cls);
  });

  if (document.body) {
    document.body.style.overflow = '';
  }

  cleanupDesktopPrintState();
}

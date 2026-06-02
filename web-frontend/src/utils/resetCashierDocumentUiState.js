import { cleanupDesktopPrintState } from './printReceipt';

/** Снимаем классы модалок/печати с document после F5 или сбоя во время print job. */
const HTML_UI_CLASSES = [
  'pos-pay-screen-open',
  'print-thermal-only',
  'print-thermal-modal',
  'electron-silent-print',
  'electron-auto-print-job',
  'electron-print-capturing',
  'electron-silent-label',
  'shelflabel-printing-active',
];

export function resetCashierDocumentUiState() {
  if (typeof document === 'undefined') return;

  HTML_UI_CLASSES.forEach((cls) => {
    document.documentElement.classList.remove(cls);
    document.body?.classList.remove(cls);
  });

  if (document.body) {
    document.body.style.overflow = '';
  }

  document.getElementById('pos-auto-print-mount')?.remove();
  cleanupDesktopPrintState();
}

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

  const printActive = HTML_UI_CLASSES.some(
    (cls) =>
      document.documentElement.classList.contains(cls) ||
      document.body?.classList.contains(cls),
  );

  HTML_UI_CLASSES.forEach((cls) => {
    document.documentElement.classList.remove(cls);
    document.body?.classList.remove(cls);
  });

  if (document.body) {
    document.body.style.overflow = '';
  }

  // Не трогаем mount во время print job — иначе Electron получит пустой DOM.
  if (!printActive) {
    document.getElementById('pos-auto-print-mount')?.remove();
    cleanupDesktopPrintState();
  }
}

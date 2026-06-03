import { isAutoPrintInFlight } from '../services/autoPrint';
import { RECEIPT_PRINT_DOM } from '../config/receiptPrintConfig';
import {
  cleanupDesktopPrintState,
  clearReceiptPrintCaptureOverrides,
} from './printReceipt';

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

  clearReceiptPrintCaptureOverrides();

  HTML_UI_CLASSES.forEach((cls) => {
    document.documentElement.classList.remove(cls);
    document.body?.classList.remove(cls);
  });

  if (document.body) {
    document.body.style.overflow = '';
  }

  if (!isAutoPrintInFlight()) {
    for (const id of RECEIPT_PRINT_DOM.staleDomIds) {
      document.getElementById(id)?.remove();
    }
    cleanupDesktopPrintState();
  }
}

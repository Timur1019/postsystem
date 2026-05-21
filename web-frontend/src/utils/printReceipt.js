import {
  prepareThermalPrint,
  printWithHtmlClass,
  PRINT_THERMAL_CLASS,
} from './printWithHtmlClass';

/** Десктоп-касса (Electron): тихая печать без диалога. */
export function isDesktopSilentPrintAvailable() {
  return typeof window.desktopCashier?.printReceipt === 'function';
}

function isOnReceiptPage() {
  return Boolean(document.getElementById('receipt-print-area'));
}

/**
 * Печать чека: сначала тихая (Electron), иначе диалог браузера.
 * @returns {Promise<'silent'|'dialog'|false>}
 */
export async function printReceipt(receiptNumber, { preferSilent = true } = {}) {
  const num = String(receiptNumber || '').trim();

  if (preferSilent && isDesktopSilentPrintAvailable()) {
    if (typeof window.desktopCashier.printCurrentPage === 'function' && isOnReceiptPage()) {
      const cleanup = prepareThermalPrint(PRINT_THERMAL_CLASS);
      try {
        await document.fonts?.ready;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise((r) => setTimeout(r, 200));
        await window.desktopCashier.printCurrentPage();
        return 'silent';
      } finally {
        cleanup();
      }
    }
    if (num) {
      await window.desktopCashier.printReceipt(num);
      return 'silent';
    }
  }

  printWithHtmlClass(PRINT_THERMAL_CLASS);
  return 'dialog';
}

/**
 * Печать чека после продажи (с кассы, без открытия страницы чека).
 * @returns {Promise<'silent'|'dialog'|false>}
 */
export async function printReceiptAfterSale(receiptNumber) {
  const num = String(receiptNumber || '').trim();
  if (!num) return false;

  if (isDesktopSilentPrintAvailable()) {
    await window.desktopCashier.printReceipt(num);
    return 'silent';
  }

  return false;
}

/** Ручная печать со страницы чека. */
export async function printReceiptDialog(receiptNumber) {
  return printReceipt(receiptNumber, { preferSilent: true });
}

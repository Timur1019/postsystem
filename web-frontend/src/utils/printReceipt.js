import { printWithHtmlClass, PRINT_THERMAL_CLASS } from './printWithHtmlClass';

/** Десктоп-касса (Electron): тихая печать без перехода на страницу чека. */
export function isDesktopSilentPrintAvailable() {
  return typeof window.desktopCashier?.printReceipt === 'function';
}

/**
 * Печать чека после продажи.
 * @returns {Promise<'silent'|'dialog'|false>} silent — ушло на принтер из Electron; dialog — открыт диалог браузера
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

/** Ручная печать со страницы чека (диалог браузера). */
export function printReceiptDialog() {
  printWithHtmlClass(PRINT_THERMAL_CLASS);
}

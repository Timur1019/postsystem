/**
 * Единая печать фiscal-чека:
 * — desktop-касса: ESC/POS (locale ru/uz, PC866/WPC1252);
 * — браузер / отчёты: window.print() по DOM.
 */
import {
  isCashierEscposPrintAvailable,
  printSaleReceiptEscpos,
} from './printSaleReceiptEscpos';

/**
 * @param {{ sale: object, t: Function, useModalShell?: boolean }} opts
 */
export async function printFiscalReceipt({ sale, t, useModalShell = true }) {
  if (isCashierEscposPrintAvailable()) {
    if (!sale) {
      throw new Error('No sale data for ESC/POS print');
    }
    return printSaleReceiptEscpos(sale, t);
  }

  const { printThermalReceiptDialog } = await import('../../utils/printReceipt');
  await printThermalReceiptDialog({ useModalShell });
  return { mode: 'dialog' };
}

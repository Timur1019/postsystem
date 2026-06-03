/**
 * Адаптер тихой печати Electron / fallback window.print.
 */
import { printThermalReceiptAuto } from '../../utils/printReceipt';

export async function printReceipt() {
  return printThermalReceiptAuto({ preferPrintHost: true, skipDomReadyWait: true });
}

export async function printTestReceipt() {
  return printThermalReceiptAuto({ preferPrintHost: false });
}

export function isSilentPrintAvailable() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.desktopCashier?.isDesktop) &&
    typeof window.desktopCashier?.printReceiptAuto === 'function'
  );
}

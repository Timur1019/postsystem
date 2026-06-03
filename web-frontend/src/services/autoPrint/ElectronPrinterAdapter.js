/**
 * Адаптер тихой печати Electron / fallback window.print.
 */
import { printThermalReceiptAuto } from '../../utils/printReceipt';
import { buildReceiptPrintPayload } from '../../utils/buildReceiptPrintPayload';

export async function printReceipt(sale) {
  const printPayload = sale ? await buildReceiptPrintPayload(sale) : null;
  return printThermalReceiptAuto({
    preferPrintHost: true,
    skipDomReadyWait: true,
    printPayload,
  });
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

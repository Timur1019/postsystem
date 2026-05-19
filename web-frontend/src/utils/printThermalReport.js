// src/utils/printThermalReport.js
import {
  prepareThermalPrint,
  printWithHtmlClass,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
} from './printWithHtmlClass';
import { isDesktopSilentPrintAvailable } from './printReceipt';

const THERMAL_REPORT_CLASSES = [PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS];

/**
 * Печать X/Z-отчёта как термочека (72/80 мм), не как страница A4.
 * @returns {Promise<'silent'|'dialog'>}
 */
export async function printThermalReport() {
  if (isDesktopSilentPrintAvailable() && typeof window.desktopCashier?.printCurrentPage === 'function') {
    const cleanup = prepareThermalPrint(THERMAL_REPORT_CLASSES);
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await window.desktopCashier.printCurrentPage();
      return 'silent';
    } finally {
      cleanup();
    }
  }

  printWithHtmlClass(THERMAL_REPORT_CLASSES);
  return 'dialog';
}

export function waitForPrintDialogClose(timeoutMs = 120_000) {
  return new Promise((resolve) => {
    const done = () => resolve();
    window.addEventListener('afterprint', done, { once: true });
    setTimeout(done, timeoutMs);
  });
}

/**
 * ESC/POS печать Z- и X/Z-отчётов смены.
 */
import { buildEscposZReportPayload } from './buildEscposZReportPayload';
import { buildEscposShiftReportPayload } from './buildEscposShiftReportPayload';
import { isCashierEscposPrintAvailable, resolveEscposPrintErrorMessage } from './printSaleReceiptEscpos';

export function isCashierEscposReportPrintAvailable() {
  return (
    isCashierEscposPrintAvailable() &&
    typeof window.desktopCashier?.printZReportEscpos === 'function' &&
    typeof window.desktopCashier?.printShiftReportEscpos === 'function'
  );
}

/**
 * @param {{ z?: object, shiftReport?: object, t: Function }} opts
 */
export async function printReportEscpos({ z, shiftReport, t }) {
  if (!isCashierEscposReportPrintAvailable()) {
    throw new Error('ESC/POS report print is only available in desktop cashier');
  }

  if (z) {
    const payload = buildEscposZReportPayload(z, t);
    if (!payload) throw new Error('No Z-report data');
    try {
      return await window.desktopCashier.printZReportEscpos(payload);
    } catch (err) {
      throw new Error(resolveEscposPrintErrorMessage(err, t));
    }
  }

  if (shiftReport) {
    const payload = buildEscposShiftReportPayload(shiftReport, t);
    if (!payload) throw new Error('No shift report data');
    try {
      return await window.desktopCashier.printShiftReportEscpos(payload);
    } catch (err) {
      throw new Error(resolveEscposPrintErrorMessage(err, t));
    }
  }

  throw new Error('Nothing to print');
}

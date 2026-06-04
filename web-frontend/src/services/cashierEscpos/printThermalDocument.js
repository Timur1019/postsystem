/**
 * Единая термопечать документов на кассе:
 * sale / Z-report / shift X-Z → ESC/POS или window.print.
 */
import { printFiscalReceipt } from './printFiscalReceipt';
import { isCashierEscposReportPrintAvailable, printReportEscpos } from './printReportEscpos';

/**
 * @param {{ sale?: object, z?: object, shiftReport?: object, t: Function, useModalShell?: boolean }} opts
 */
export async function printThermalDocument({ sale, z, shiftReport, t, useModalShell = true }) {
  if (sale) {
    return printFiscalReceipt({ sale, t, useModalShell });
  }

  if (isCashierEscposReportPrintAvailable() && (z || shiftReport)) {
    return printReportEscpos({ z, shiftReport, t });
  }

  const { printThermalReceiptDialog } = await import('../../utils/printReceipt');
  await printThermalReceiptDialog({ useModalShell });
  return { mode: 'dialog' };
}

/**
 * Печать этикетки / ценника — тот же путь, что чек и Z/X: ESC/POS через Electron.
 */
import { ensureDesktopLabelPrinter } from '../services/cashierEscpos/ensureDesktopLabelPrinter';
import { printLabelEscpos } from '../services/cashierEscpos/printLabelEscpos';

/**
 * @param {ReturnType<import('./buildLabelPrintJob').buildLabelPrintJob>} printJob
 * @param {Function} t
 */
export async function printShelfLabel(printJob, t) {
  await ensureDesktopLabelPrinter(t);
  return printLabelEscpos(printJob, t);
}

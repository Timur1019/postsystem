/**
 * Единая печать этикетки / ценника.
 * TSPL (XP-365B по сети) → драйвер Windows (HTML) → ESC/POS запасной путь.
 */
import { isDesktopLabelPrintAvailable } from '../../shelfLabelPrint/printShelfLabelDriver';
import { isCashierEscposLabelPrintAvailable, printLabelEscpos } from './printLabelEscpos';
import { isLabelTsplEnabled, isLabelTsplPrintAvailable, printLabelTspl } from './printLabelTspl';

/**
 * @param {object} printJob — результат buildLabelPrintJob
 * @param {Function} t
 * @param {{ requireBarcode?: boolean, preferDriverPrint?: boolean, fallback?: Function }} [opts]
 */
export async function printShelfLabelUnified(printJob, t, opts = {}) {
  const { requireBarcode = true, preferDriverPrint = true, fallback } = opts;

  if (requireBarcode && printJob?.showBarcode && !String(printJob?.barcode || '').trim()) {
    throw new Error('No barcode');
  }

  if (isLabelTsplPrintAvailable() && (await isLabelTsplEnabled())) {
    return printLabelTspl(printJob, t);
  }

  if (preferDriverPrint && isDesktopLabelPrintAvailable()) {
    if (typeof fallback === 'function') {
      return fallback();
    }
    const { printShelfLabelSilent } = await import('../../shelfLabelPrint/printShelfLabelDriver');
    return printShelfLabelSilent({ requireBarcode });
  }

  if (isCashierEscposLabelPrintAvailable()) {
    return printLabelEscpos(printJob, t);
  }

  if (typeof fallback === 'function') {
    return fallback();
  }

  const { printShelfLabelSilent } = await import('../../shelfLabelPrint/printShelfLabelDriver');
  return printShelfLabelSilent({ requireBarcode });
}

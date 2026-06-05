/**
 * Единая печать этикетки / ценника.
 * На десктопе для XP-365B и аналогов — сначала печать через драйвер (HTML + printLabelPage),
 * ESC/POS — запасной путь, если printLabelPage недоступен.
 */
import { isDesktopLabelPrintAvailable } from '../../shelfLabelPrint/printShelfLabelDriver';
import { isCashierEscposLabelPrintAvailable, printLabelEscpos } from './printLabelEscpos';

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

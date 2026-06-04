/**
 * Единая печать этикетки.
 * На десктопе для XP-365 и аналогов — сначала печать через драйвер (HTML + printLabelPage),
 * ESC/POS — запасной путь, если printLabelPage недоступен.
 */
import {
  isDesktopLabelPrintAvailable,
  printShelfLabelSilent,
} from '../../utils/printShelfLabel';
import { isCashierEscposLabelPrintAvailable, printLabelEscpos } from './printLabelEscpos';

/**
 * @param {object} labelInput — productName, barcode, price, copies, paperWmm…
 * @param {Function} t
 * @param {{ requireBarcode?: boolean, preferDriverPrint?: boolean, fallback?: Function }} [opts]
 */
export async function printShelfLabelUnified(labelInput, t, opts = {}) {
  const { requireBarcode = true, preferDriverPrint = true, fallback } = opts;

  if (requireBarcode && labelInput?.showBarcode && !String(labelInput?.barcode || '').trim()) {
    throw new Error('No barcode');
  }

  if (preferDriverPrint && isDesktopLabelPrintAvailable()) {
    if (typeof fallback === 'function') {
      return fallback();
    }
    return printShelfLabelSilent({ requireBarcode });
  }

  if (isCashierEscposLabelPrintAvailable()) {
    return printLabelEscpos(labelInput, t);
  }

  if (typeof fallback === 'function') {
    return fallback();
  }

  return printShelfLabelSilent({ requireBarcode });
}

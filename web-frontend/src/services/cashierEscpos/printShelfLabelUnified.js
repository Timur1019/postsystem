/**
 * Единая печать этикетки: ESC/POS на desktop-кассе, иначе window.print / Chromium.
 */
import { isCashierEscposLabelPrintAvailable, printLabelEscpos } from './printLabelEscpos';

/**
 * @param {object} labelInput — productName, barcode, price, copies, paperWmm…
 * @param {Function} t
 * @param {{ requireBarcode?: boolean, fallback?: Function }} [opts]
 */
export async function printShelfLabelUnified(labelInput, t, opts = {}) {
  const { requireBarcode = true, fallback } = opts;

  if (requireBarcode && labelInput?.showBarcode && !String(labelInput?.barcode || '').trim()) {
    throw new Error('No barcode');
  }

  if (isCashierEscposLabelPrintAvailable()) {
    return printLabelEscpos(labelInput, t);
  }

  if (typeof fallback === 'function') {
    return fallback();
  }

  const { printShelfLabelSilent } = await import('../../utils/printShelfLabel');
  return printShelfLabelSilent({ requireBarcode });
}

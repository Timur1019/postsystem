/**
 * Единая печать этикетки: ESC/POS на desktop-кассе, иначе window.print / Chromium.
 */
import { isCashierEscposLabelPrintAvailable, printLabelEscpos } from './printLabelEscpos';

/**
 * @param {object} labelInput — productName, barcode, price, copies, paperWmm…
 * @param {Function} t
 * @param {{ requireBarcode?: boolean, preferHtmlPrint?: boolean, fallback?: Function }} [opts]
 */
export async function printShelfLabelUnified(labelInput, t, opts = {}) {
  const { requireBarcode = true, preferHtmlPrint = false, fallback } = opts;

  if (requireBarcode && labelInput?.showBarcode && !String(labelInput?.barcode || '').trim()) {
    throw new Error('No barcode');
  }

  const useEscpos = isCashierEscposLabelPrintAvailable() && !preferHtmlPrint;
  if (useEscpos) {
    return printLabelEscpos(labelInput, t);
  }

  if (typeof fallback === 'function') {
    return fallback();
  }

  const { printShelfLabelSilent } = await import('../../utils/printShelfLabel');
  return printShelfLabelSilent({ requireBarcode });
}

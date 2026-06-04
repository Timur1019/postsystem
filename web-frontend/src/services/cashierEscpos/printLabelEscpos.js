/**
 * ESC/POS печать этикеток на принтер штрих-кодов.
 */
import { buildEscposLabelPayload } from './buildEscposLabelPayload';
import { isCashierEscposPrintAvailable, resolveEscposPrintErrorMessage } from './printSaleReceiptEscpos';

export function isCashierEscposLabelPrintAvailable() {
  return (
    isCashierEscposPrintAvailable() &&
    typeof window.desktopCashier?.printLabelsEscpos === 'function'
  );
}

/**
 * @param {object} labelInput
 * @param {Function} t
 */
export async function printLabelEscpos(labelInput, t) {
  if (!isCashierEscposLabelPrintAvailable()) {
    throw new Error('ESC/POS label print is only available in desktop cashier');
  }

  const payload = buildEscposLabelPayload(labelInput, t);
  if (!payload) throw new Error('No label data');

  try {
    return await window.desktopCashier.printLabelsEscpos(payload);
  } catch (err) {
    throw new Error(resolveEscposPrintErrorMessage(err, t));
  }
}

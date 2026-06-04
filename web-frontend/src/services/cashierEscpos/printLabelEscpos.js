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
    const msg = err?.message || String(err || '');
    if (/NO_PRINTER|принтер этикет|штрих-код/i.test(msg)) {
      throw new Error(
        t('usersBarcodePrint.labelPrinterRequired', {
          defaultValue:
            'Принтер штрих-кодов не выбран. Меню Aurent → «Принтер штрих-кодов» — укажите термопринтер этикеток из списка Windows.',
        }),
      );
    }
    throw new Error(resolveEscposPrintErrorMessage(err, t));
  }
}

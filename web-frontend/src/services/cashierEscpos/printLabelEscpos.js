/**
 * ESC/POS печать этикеток / ценников (принтер штрих-кодов).
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
 * @param {object} printJob — из buildLabelPrintJob
 * @param {Function} t
 */
export async function printLabelEscpos(printJob, t) {
  if (!isCashierEscposLabelPrintAvailable()) {
    throw new Error('ESC/POS label print is only available in desktop cashier');
  }

  const payload = buildEscposLabelPayload(printJob, t);
  if (!payload) {
    throw new Error(t('usersBarcodePrint.printFailed', { defaultValue: 'Не удалось подготовить этикетку.' }));
  }

  try {
    const result = await window.desktopCashier.printLabelsEscpos(payload);
    console.info('[Aurent-ESCPOS] label print ok', result?.jobId, result?.deviceName);
    return result;
  } catch (err) {
    console.warn('[Aurent-ESCPOS] label print failed', {
      code: err?.code,
      step: err?.step,
      message: err?.message,
    });
    const msg = err?.message || String(err || '');
    if (err?.code === 'NO_PRINTER' || /принтер этикет|штрих-код|label/i.test(msg)) {
      throw new Error(
        t('usersBarcodePrint.labelPrinterRequired', {
          defaultValue:
            'Принтер штрих-кодов не выбран. Меню Aurent → «Принтер штрих-кодов» — укажите термопринтер этикеток.',
        }),
      );
    }
    throw new Error(resolveEscposPrintErrorMessage(err, t));
  }
}

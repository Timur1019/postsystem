/**
 * Вызов ESC/POS печати через Electron preload (изолирован от printReceipt / этикеток).
 */
import { CASHIER_ESCPOS_IPC } from '../../config/cashierEscposConfig';
import { buildCashierEscposPayload } from './buildCashierEscposPayload';

/**
 * Доступна ли тихая ESC/POS печать в этом окружении.
 */
export function isCashierEscposPrintAvailable() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.desktopCashier?.isDesktop) &&
    typeof window.desktopCashier?.printReceiptEscpos === 'function'
  );
}

/**
 * Преобразует ошибку IPC в понятное сообщение.
 * @param {unknown} err
 * @param {Function} t
 */
export function resolveEscposPrintErrorMessage(err, t) {
  const code = err?.code || '';
  const msg = err?.message || String(err || '');

  if (code === 'NO_PRINTER' || /принтер чека не/i.test(msg)) {
    return t('pos.autoPrintPrinterError', {
      defaultValue:
        'Не удалось отправить чек на принтер. Aurent → «Принтер чека», затем повторите из «Мои продажи».',
    });
  }
  if (code === 'DRIVER_MISSING') {
    return t('pos.escposDriverMissing', {
      defaultValue:
        'Печать чека недоступна в этой версии приложения. Обновите Aurent Cashier с сайта установки или обратитесь в поддержку.',
    });
  }
  if (code === 'NOT_CONNECTED' || code === 'EXECUTE_FAILED') {
    return msg || t('pos.autoPrintFailed', { defaultValue: 'Не удалось напечатать чек.' });
  }
  if (code === 'BUILD_FAILED' || code === 'INVALID_PAYLOAD') {
    return msg || t('pos.autoPrintForming', { defaultValue: 'Чек не готов для печати.' });
  }
  return msg || t('pos.autoPrintFailed', { defaultValue: 'Не удалось напечатать чек.' });
}

/**
 * Печать чека после продажи (ESC/POS).
 * @param {object} sale
 * @param {Function} t — i18n
 */
export async function printSaleReceiptEscpos(sale, t) {
  if (!isCashierEscposPrintAvailable()) {
    throw new Error('ESCPOS print is only available in desktop cashier');
  }

  const payload = buildCashierEscposPayload(sale, t);
  if (!payload) {
    throw new Error('No sale data for ESC/POS print');
  }

  try {
    const result = await window.desktopCashier.printReceiptEscpos(payload);
    console.info('[Aurent-ESCPOS] print ok', result?.jobId, result?.deviceName);
    return result;
  } catch (err) {
    console.warn('[Aurent-ESCPOS] print failed', {
      code: err?.code,
      step: err?.step,
      message: err?.message,
    });
    const message = resolveEscposPrintErrorMessage(err, t);
    const wrapped = new Error(message);
    wrapped.code = err?.code;
    wrapped.step = err?.step;
    throw wrapped;
  }
}

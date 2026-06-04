/**
 * Перед печатью этикетки — явно выбранный «Принтер штрих-кодов» в Aurent.
 */
import { isDesktopCashier } from '../../utils/printReceipt';
import { isDesktopLabelPrintAvailable } from '../../utils/printShelfLabel';
import { isCashierEscposLabelPrintAvailable } from './printLabelEscpos';

async function readLabelPrinterName() {
  if (typeof window.desktopCashier?.getPrinterSettings !== 'function') {
    return '';
  }
  const settings = await window.desktopCashier.getPrinterSettings();
  return String(settings?.labelPrinterName || '').trim();
}

/** Десктоп Aurent с печатью этикеток (драйвер или ESC/POS). */
export function isDesktopLabelPrintEnvironment() {
  return (
    isDesktopCashier() &&
    (isDesktopLabelPrintAvailable() || isCashierEscposLabelPrintAvailable())
  );
}

/** @deprecated используйте isDesktopLabelPrintEnvironment */
export function isDesktopLabelEscposEnvironment() {
  return isDesktopLabelPrintEnvironment();
}

/**
 * @param {Function} t
 * @returns {Promise<{ deviceName: string }>}
 */
export async function ensureDesktopLabelPrinter(t) {
  if (!isDesktopCashier()) {
    throw new Error(
      t('usersBarcodePrint.needDesktopApp', {
        defaultValue:
          'Печать ценников работает только в приложении Aurent (десктоп). Установите с раздела загрузки, войдите и выберите «Принтер штрих-кодов» в меню.',
      }),
    );
  }

  let name = await readLabelPrinterName();
  if (name) {
    return { deviceName: name };
  }

  if (typeof window.desktopCashier.openLabelPrinterPicker === 'function') {
    await window.desktopCashier.openLabelPrinterPicker();
    name = await readLabelPrinterName();
  }

  if (name) {
    return { deviceName: name };
  }

  throw new Error(
    t('usersBarcodePrint.labelPrinterRequired', {
      defaultValue:
        'Принтер штрих-кодов не выбран. Меню Aurent → «Принтер штрих-кодов» — укажите термопринтер этикеток из списка Windows.',
    }),
  );
}

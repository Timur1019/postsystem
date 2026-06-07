/**
 * Перед печатью этикетки — выбранный «Принтер штрих-кодов» в Aurent
 * или TSPL (сетевой XP-365B).
 */
import { isDesktopCashier } from '../../utils/printReceipt';
import { isDesktopLabelPrintAvailable } from '../../shelfLabelPrint/printShelfLabelDriver';
import { isCashierEscposLabelPrintAvailable } from './printLabelEscpos';
import { isLabelTsplEnabled, isLabelTsplPrintAvailable } from './printLabelTspl';

async function readLabelPrinterName() {
  if (typeof window.desktopCashier?.getPrinterSettings !== 'function') {
    return '';
  }
  const settings = await window.desktopCashier.getPrinterSettings();
  return String(settings?.labelPrinterName || '').trim();
}

/** Десктоп Aurent с печатью этикеток (драйвер / TSPL / ESC/POS). */
export function isDesktopLabelPrintEnvironment() {
  return (
    isDesktopCashier() &&
    (isDesktopLabelPrintAvailable() || isLabelTsplPrintAvailable() || isCashierEscposLabelPrintAvailable())
  );
}

/**
 * @param {Function} t
 * @returns {Promise<{ deviceName: string, mode?: 'tspl'|'driver' }>}
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

  if (isLabelTsplPrintAvailable() && (await isLabelTsplEnabled())) {
    const settings = await window.desktopCashier.labelTsplGetSettings();
    const host = String(settings?.host || '').trim();
    if (!host) {
      throw new Error(
        t('usersBarcodePrint.tsplHostRequired', {
          defaultValue: 'Укажите IP принтера этикеток в настройках TSPL (XP-365B).',
        }),
      );
    }
    const port = Number(settings?.port) || 9100;
    return { deviceName: `${host}:${port}`, mode: 'tspl' };
  }

  if (!isCashierEscposLabelPrintAvailable() && !isDesktopLabelPrintAvailable()) {
    throw new Error(
      t('pos.escposDriverMissing', {
        defaultValue: 'Печать недоступна в этой версии приложения. Обновите Aurent Cashier.',
      }),
    );
  }

  let name = await readLabelPrinterName();
  if (name) {
    return { deviceName: name, mode: 'driver' };
  }

  if (typeof window.desktopCashier.openLabelPrinterPicker === 'function') {
    await window.desktopCashier.openLabelPrinterPicker();
    name = await readLabelPrinterName();
  }

  if (name) {
    return { deviceName: name, mode: 'driver' };
  }

  throw new Error(
    t('usersBarcodePrint.labelPrinterRequired', {
      defaultValue:
        'Принтер штрих-кодов не выбран. Меню Aurent → «Принтер штрих-кодов» — укажите термопринтер этикеток.',
    }),
  );
}

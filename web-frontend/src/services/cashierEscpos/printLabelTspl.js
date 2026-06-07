import { buildTsplLabelPayload } from './buildTsplLabelPayload';

export function isLabelTsplPrintAvailable() {
  return (
    typeof window !== 'undefined' &&
    window.desktopCashier?.isDesktop === true &&
    typeof window.desktopCashier?.printLabelTspl === 'function' &&
    typeof window.desktopCashier?.labelTsplGetSettings === 'function'
  );
}

export async function readLabelTsplSettings() {
  if (!isLabelTsplPrintAvailable()) {
    return { enabled: false, host: '', port: 9100, gapMm: 2 };
  }
  return window.desktopCashier.labelTsplGetSettings();
}

export async function isLabelTsplEnabled() {
  if (!isLabelTsplPrintAvailable()) return false;
  const settings = await readLabelTsplSettings();
  return Boolean(settings?.enabled && String(settings?.host || '').trim());
}

/**
 * @param {object} printJob
 * @param {Function} t
 */
export async function printLabelTspl(printJob, t) {
  if (!isLabelTsplPrintAvailable()) {
    throw new Error('TSPL-печать доступна только в приложении Aurent (десктоп).');
  }

  const payload = buildTsplLabelPayload(printJob, t);
  if (!payload) {
    throw new Error(t('usersBarcodePrint.printFailed', { defaultValue: 'Не удалось подготовить этикетку.' }));
  }

  try {
    const result = await window.desktopCashier.printLabelTspl(payload);
    return {
      mode: 'tspl',
      deviceName: result?.deviceName || result?.target || '',
    };
  } catch (err) {
    const msg = err?.message || String(err || '');
    if (err?.code === 'TSPL_NO_HOST' || /IP|TSPL/i.test(msg)) {
      throw new Error(
        t('usersBarcodePrint.tsplHostRequired', {
          defaultValue: 'Укажите IP принтера этикеток в настройках TSPL (XP-365B).',
        }),
      );
    }
    throw new Error(msg || t('usersBarcodePrint.printFailed', { defaultValue: 'Не удалось напечатать.' }));
  }
}

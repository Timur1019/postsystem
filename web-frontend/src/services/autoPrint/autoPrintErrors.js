/**
 * Понятные сообщения для кассира (маппинг технических ошибок).
 */

const FORMING_RE =
  /не готов|не найден|пустой|формир|ready|height|text too|images not|автопечат/i;
const PRINTER_RE =
  /принтер|printer|device|очеред|Aurent|remote method|Script failed|тихая печать/i;

/**
 * @param {unknown} err
 * @param {(key: string, opts?: object) => string} t
 */
export function resolveAutoPrintToastMessage(err, t) {
  const raw = err?.message || String(err || '');
  if (PRINTER_RE.test(raw) && !FORMING_RE.test(raw)) {
    return t('pos.autoPrintPrinterError', {
      defaultValue:
        'Не удалось отправить чек на принтер. Aurent → «Принтер чека», затем повторите печать из «Мои продажи».',
    });
  }
  if (FORMING_RE.test(raw)) {
    return t('pos.autoPrintForming', {
      defaultValue:
        'Чек ещё формируется. Подождите 2–3 секунды; при необходимости повторите печать в «Мои продажи».',
    });
  }
  return t('pos.autoPrintFailed', {
    defaultValue: 'Не удалось напечатать чек. Повторите печать в разделе «Мои продажи».',
  });
}

/**
 * Автопечать после продажи — только фон (без превью окна чека на экране).
 * Схема Electron: скрытое окно в main → webContents.print silent.
 */
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { printDesktopReceiptSale } from '../../utils/printReceipt';

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    if (!sale?.receiptNumber) return undefined;

    let cancelled = false;

    printDesktopReceiptSale(sale, { autoPrint: true, qrDataUrl: sale.qrDataUrl || null })
      .then((result) => {
        if (cancelled) return;
        if (!result?.ok) {
          toast.error(t('pos.printFailed'), { id: 'pos-auto-print' });
          return;
        }
        if (result.mode === 'dialog') {
          toast('Нажмите «Печать» в окне Windows', { id: 'pos-auto-print', duration: 6000 });
        } else {
          toast.success(t('receipt.printSent', { defaultValue: 'Чек отправлен на печать' }), {
            id: 'pos-auto-print',
            duration: 3000,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[Aurent] auto print failed', err);
          toast.error(err?.message || t('pos.printFailed'), { id: 'pos-auto-print' });
        }
      })
      .finally(() => {
        if (!cancelled) onDoneRef.current?.();
      });

    return () => {
      cancelled = true;
    };
  }, [sale?.receiptNumber, sale?.qrDataUrl, t]);

  return null;
}

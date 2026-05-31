/**
 * Автопечать после продажи на десктопе — без модалки, сразу в фоне.
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

    const run = async () => {
      const qrImg = document.querySelector('.receipt-qr');
      const qrDataUrl = qrImg?.src || null;

      printDesktopReceiptSale(sale, { qrDataUrl, autoPrint: true })
        .then((result) => {
          if (cancelled) return;
          if (!result?.ok) {
            toast.error(t('pos.printFailed'), { id: 'pos-auto-print' });
            return;
          }
          if (result.mode === 'dialog') {
            toast('Нажмите «Печать» в окне Windows', { id: 'pos-auto-print', duration: 6000 });
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn('[Aurent] auto print failed', err);
            toast.error(err?.message || t('pos.printFailed'), { id: 'pos-auto-print' });
          }
        });

      if (!cancelled) onDoneRef.current?.();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [sale?.receiptNumber, t]);

  return null;
}

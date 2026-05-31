// Автопечать после продажи: скрытое окно Electron (/receipt?silent=1), как тестовый чек.
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { printReceiptAfterSale } from '../../utils/printReceipt';

export default function PosSaleAutoPrint({ sale, onDone, onFallback }) {
  const { t } = useTranslation();
  const startedRef = useRef(false);

  useEffect(() => {
    const num = sale?.receiptNumber;
    if (!num || startedRef.current) return undefined;
    startedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const mode = await printReceiptAfterSale(num);
        if (cancelled) return;
        if (mode === 'silent') {
          toast.success(t('pos.saleSuccess'));
          onDone?.();
          return;
        }
        toast.error(t('pos.printFailed'));
        onFallback?.(sale);
      } catch (e) {
        if (cancelled) return;
        const msg = e?.message ?? t('pos.printFailed');
        toast.error(msg, { duration: 8000 });
        onFallback?.(sale);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sale, onDone, onFallback, t]);

  return null;
}

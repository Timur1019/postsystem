/**
 * Автопечать после продажи на десктопе + превью чека слева (без блокирующей модалки).
 */
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import { cleanupDesktopPrintState, printDesktopReceiptSale } from '../../utils/printReceipt';
import '../../styles/pos-sale-auto-print.css';

const QR_WAIT_MS = 2000;
const PREVIEW_MIN_MS = 1800;

async function waitForQrInShell(maxMs = QR_WAIT_MS) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const img = document.querySelector('#pos-sale-print-shell .receipt-qr');
    if (img && img.complete && img.naturalWidth > 0 && img.src) {
      return img.src;
    }
    if (!document.querySelector('#pos-sale-print-shell')) {
      await new Promise((r) => setTimeout(r, 80));
      continue;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const img = document.querySelector('#pos-sale-print-shell .receipt-qr');
  return img?.src || null;
}

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  const previewStartedRef = useRef(Date.now());
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    if (!sale?.receiptNumber) return undefined;

    let cancelled = false;
    const finish = async () => {
      const elapsed = Date.now() - previewStartedRef.current;
      if (elapsed < PREVIEW_MIN_MS) {
        await new Promise((r) => setTimeout(r, PREVIEW_MIN_MS - elapsed));
      }
      cleanupDesktopPrintState();
      if (!cancelled) onDoneRef.current?.();
    };

    const run = async () => {
      const qrDataUrl = await waitForQrInShell();
      if (cancelled) return;

      try {
        const result = await printDesktopReceiptSale(sale, { qrDataUrl, autoPrint: true });
        if (cancelled) return;
        if (result.ok) {
          if (result.mode === 'dialog') {
            toast('Нажмите «Печать» в окне Windows', { id: 'pos-auto-print', duration: 6000 });
          } else {
            toast.success(t('receipt.printSent', { defaultValue: 'Чек отправлен на печать' }), {
              id: 'pos-auto-print',
              duration: 3000,
            });
          }
          await finish();
          return;
        }
        if (!cancelled) {
          toast.error(t('pos.printFailed'), { id: 'pos-auto-print' });
          await finish();
        }
      } catch (err) {
        console.warn('[Aurent] auto print failed', err);
        if (!cancelled) {
          toast.error(err?.message || t('pos.printFailed'), { id: 'pos-auto-print' });
          await finish();
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [sale?.receiptNumber, t]);

  if (!sale) return null;

  return (
    <div className="pos-sale-auto-print" role="status" aria-live="polite">
      <div className="pos-sale-auto-print__backdrop" aria-hidden />
      <div className="pos-sale-auto-print__paper">
        <div id="pos-sale-print-shell" className="pos-sale-auto-print__shell">
          <FiscalReceiptBody sale={sale} />
        </div>
      </div>
    </div>
  );
}

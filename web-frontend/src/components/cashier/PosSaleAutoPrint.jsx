/**
 * Автопечать после продажи: превью на экране + печать только чека (portal → fiscal-print-shell).
 */
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import { cleanupDesktopPrintState, printThermalReceiptDialog } from '../../utils/printReceipt';
import '../../styles/pos-sale-auto-print.css';

const QR_WAIT_MS = 2000;
const PREVIEW_MIN_MS = 1500;

async function waitForQrReady(maxMs = QR_WAIT_MS) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const img =
      document.querySelector('#fiscal-print-shell .receipt-qr') ||
      document.querySelector('#pos-sale-print-shell .receipt-qr');
    if (img && img.complete && img.naturalWidth > 0 && img.src) {
      return img.src;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
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
      await waitForQrReady();
      if (cancelled) return;

      try {
        await printThermalReceiptDialog({ useModalShell: true });
        if (!cancelled) {
          toast.success(t('receipt.printSent', { defaultValue: 'Чек отправлен на печать' }), {
            id: 'pos-auto-print',
            duration: 3000,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Aurent] auto print failed', err);
          toast.error(err?.message || t('pos.printFailed'), { id: 'pos-auto-print' });
        }
      }

      await finish();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [sale?.receiptNumber, t]);

  if (!sale) return null;

  const printPortal = createPortal(
    <div className="fiscal-print-scene pos-sale-print-host" aria-hidden>
      <div className="fiscal-print-dialog">
        <div id="fiscal-print-shell">
          <FiscalReceiptBody sale={sale} />
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <div className="pos-sale-auto-print" role="status" aria-live="polite">
        <div className="pos-sale-auto-print__backdrop" aria-hidden />
        <div className="pos-sale-auto-print__paper">
          <div id="pos-sale-print-shell" className="pos-sale-auto-print__shell">
            <FiscalReceiptBody sale={sale} />
          </div>
        </div>
      </div>
      {printPortal}
    </>
  );
}

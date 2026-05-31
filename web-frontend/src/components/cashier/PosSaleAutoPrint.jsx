/**
 * Автопечать после продажи на десктопе.
 */
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import { printDesktopReceiptSale } from '../../utils/printReceipt';

const QR_WAIT_MS = 2000;

async function waitForQrInShell(maxMs = QR_WAIT_MS) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const img = document.querySelector('#fiscal-print-shell .receipt-qr');
    if (img && img.complete && img.naturalWidth > 0 && img.src) {
      return img.src;
    }
    if (!document.querySelector('#fiscal-print-shell')) {
      await new Promise((r) => setTimeout(r, 80));
      continue;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const img = document.querySelector('#fiscal-print-shell .receipt-qr');
  return img?.src || null;
}

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    if (!sale?.receiptNumber) return undefined;

    let cancelled = false;
    const finish = () => {
      if (!cancelled) onDoneRef.current?.();
    };

    const run = async () => {
      const qrDataUrl = await waitForQrInShell();
      if (cancelled) return;

      try {
        const result = await printDesktopReceiptSale(sale, { qrDataUrl });
        if (cancelled) return;
        if (result.ok) {
          if (result.mode === 'dialog') {
            toast('Нажмите «Печать» в окне Windows', { id: 'pos-auto-print', duration: 5000 });
          }
          finish();
          return;
        }
      } catch (err) {
        console.warn('[Aurent] auto print failed', err);
      }

      if (!cancelled) {
        toast.error(t('pos.printFailed'), { id: 'pos-auto-print' });
        finish();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [sale?.receiptNumber, t]);

  if (!sale) return null;

  return (
    <div className="fiscal-print-scene thermal-report-print-host" aria-hidden style={{ position: 'fixed', left: -10000, top: 0 }}>
      <div id="fiscal-print-shell">
        <FiscalReceiptBody sale={sale} />
      </div>
    </div>
  );
}

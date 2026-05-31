/**
 * Автопечать после продажи: скрытый чек в DOM + модалка «Печатается чек…».
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import ReceiptPrintingOverlay from './ReceiptPrintingOverlay';
import { cleanupDesktopPrintState, printThermalReceiptAuto } from '../../utils/printReceipt';

const QR_WAIT_MS = 2000;

async function waitForQrInShell(maxMs = QR_WAIT_MS) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const img = document.querySelector('#fiscal-print-shell .receipt-qr');
    if (img && img.complete && img.naturalWidth > 0 && img.src) {
      return img.src;
    }
    if (!document.getElementById('fiscal-print-shell')) {
      await new Promise((r) => setTimeout(r, 80));
      continue;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  const [showOverlay, setShowOverlay] = useState(true);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    if (!sale?.receiptNumber) return undefined;

    let cancelled = false;
    setShowOverlay(true);

    const run = async () => {
      await waitForQrInShell();
      if (cancelled) return;

      try {
        await printThermalReceiptAuto();
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
      } finally {
        if (!cancelled) {
          setShowOverlay(false);
          cleanupDesktopPrintState();
          onDoneRef.current?.();
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      setShowOverlay(false);
    };
  }, [sale?.receiptNumber, t]);

  if (!sale) return null;

  const printPortal = createPortal(
    <div className="fiscal-print-scene fiscal-print-scene--offscreen pos-sale-print-host" aria-hidden>
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
      <ReceiptPrintingOverlay open={showOverlay} />
      {printPortal}
    </>
  );
}

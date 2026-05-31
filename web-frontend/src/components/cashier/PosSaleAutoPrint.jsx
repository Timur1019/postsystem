/**
 * Автопечать после продажи на десктопе + модалка «Печатается чек…».
 * Модалка закрывается через ~1.5 с — не ждём IPC (Windows POS-80 часто не отдаёт callback).
 */
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import DesktopPrintOverlay from './DesktopPrintOverlay';
import { cleanupDesktopPrintState, printDesktopReceiptSale } from '../../utils/printReceipt';
import '../../styles/pos-sale-auto-print.css';

const QR_WAIT_MS = 800;
const MODAL_VISIBLE_MS = 1500;

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
    await new Promise((r) => setTimeout(r, 80));
  }
  const img = document.querySelector('#pos-sale-print-shell .receipt-qr');
  return img?.src || null;
}

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    if (!sale?.receiptNumber) return undefined;

    let cancelled = false;
    let modalClosed = false;

    const closeModal = () => {
      if (modalClosed || cancelled) return;
      modalClosed = true;
      cleanupDesktopPrintState();
      onDoneRef.current?.();
    };

    const run = async () => {
      const qrDataUrl = await waitForQrInShell();
      if (cancelled) return;

      const printPromise = printDesktopReceiptSale(sale, { qrDataUrl, autoPrint: true });

      await new Promise((r) => setTimeout(r, MODAL_VISIBLE_MS));
      closeModal();

      try {
        const result = await printPromise;
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
          return;
        }
        toast.error(t('pos.printFailed'), { id: 'pos-auto-print' });
      } catch (err) {
        if (!cancelled) {
          console.warn('[Aurent] auto print failed', err);
          toast.error(err?.message || t('pos.printFailed'), { id: 'pos-auto-print' });
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
    <DesktopPrintOverlay open messageKey="receipt.printing">
      <div className="pos-sale-auto-print" role="status" aria-live="polite">
        <div className="pos-sale-auto-print__paper">
          <div id="pos-sale-print-shell" className="pos-sale-auto-print__shell">
            <FiscalReceiptBody sale={sale} />
          </div>
        </div>
      </div>
    </DesktopPrintOverlay>
  );
}

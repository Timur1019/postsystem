/**
 * Автопечать после продажи на десктопе.
 * Чек собирается в Electron из JSON продажи (полные стили, без Tailwind).
 */
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import { buildDesktopSalePrintPayload } from '../../utils/printReceipt';

const QR_WAIT_MS = 2500;

async function waitForQrInDom(maxMs = QR_WAIT_MS) {
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
    const imgs = document.querySelectorAll('#fiscal-print-shell img');
    if (imgs.length === 0) {
      return null;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const img = document.querySelector('#fiscal-print-shell .receipt-qr');
  return img?.src || null;
}

async function printSaleOnDesktop(payload) {
  if (!payload || typeof window.desktopCashier?.printReceiptSale !== 'function') {
    return { ok: false };
  }
  try {
    const result = await window.desktopCashier.printReceiptSale(payload);
    return { ok: true, mode: result?.mode || 'silent' };
  } catch (err) {
    console.warn('[Aurent] printReceiptSale failed', err);
  }
  if (typeof window.desktopCashier?.printReceiptSaleDialog === 'function') {
    try {
      await window.desktopCashier.printReceiptSaleDialog(payload);
      return { ok: true, mode: 'dialog' };
    } catch (dialogErr) {
      console.warn('[Aurent] printReceiptSaleDialog failed', dialogErr);
    }
  }
  return { ok: false };
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
      const qrDataUrl = await waitForQrInDom();
      if (cancelled) return;

      const payload = buildDesktopSalePrintPayload(sale, qrDataUrl);
      const result = await printSaleOnDesktop(payload);
      if (cancelled) return;

      if (result.ok) {
        if (result.mode === 'dialog') {
          toast(t('receipt.printSent'), { id: 'pos-auto-print' });
        }
        finish();
        return;
      }

      toast.error(t('pos.printFailed'), { id: 'pos-auto-print' });
      finish();
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

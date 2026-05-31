/**
 * Автопечать после продажи на десктопе.
 * Чек собирается в Electron из JSON продажи (полные стили, без Tailwind).
 * Запасной путь — window.print (диалог Windows).
 */
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import { printThermalReceiptDialog } from '../../utils/printReceipt';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

async function waitForQrInDom(maxMs = 6000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const img = document.querySelector('#receipt-print-area .receipt-qr');
    if (img && img.complete && img.naturalWidth > 0 && img.src) {
      return img.src;
    }
    if (!document.querySelector('#receipt-print-area')) {
      await new Promise((r) => setTimeout(r, 80));
      continue;
    }
    const imgs = document.querySelectorAll('#receipt-print-area img');
    if (imgs.length === 0) {
      return null;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const img = document.querySelector('#receipt-print-area .receipt-qr');
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
      const qrDataUrl = await waitForQrInDom();
      if (cancelled) return;

      const td = useTenantDisplayStore.getState();
      const payload = {
        ...sale,
        qrDataUrl,
        _branding: {
          companyName: td.receiptCompanyName || sale.storeName || undefined,
          companyAddress: td.receiptCompanyAddress || undefined,
          stir: td.receiptStir || undefined,
          logoDataUrl: td.receiptLogoDataUrl || undefined,
        },
      };

      if (typeof window.desktopCashier?.printReceiptSale === 'function') {
        try {
          await window.desktopCashier.printReceiptSale(payload);
          finish();
          return;
        } catch (err) {
          console.warn('[Aurent] printReceiptSale failed', err);
        }
      }

      if (cancelled) return;
      try {
        await printThermalReceiptDialog({ useModalShell: true });
        finish();
      } catch {
        if (!cancelled) {
          toast.error(t('pos.printFailed'));
          finish();
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
    <div className="fiscal-print-scene thermal-report-print-host" aria-hidden style={{ position: 'fixed', left: -10000, top: 0 }}>
      <div id="fiscal-print-shell">
        <FiscalReceiptBody sale={sale} />
      </div>
    </div>
  );
}

/**
 * Автопечать после продажи на десктопе.
 * 1. Чек из ответа API → DOM
 * 2. printReceiptHtml → скрытое окно → silent print
 * 3. printReceipt(номер) — запасной путь
 * 4. window.print — диалог Windows
 */
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import { printThermalReceiptDialog } from '../../utils/printReceipt';
import { syncPrintCssVars } from '../../utils/syncPrintCssVars';
import { usePrintSettingsStore } from '../../store/printSettingsStore';

async function waitForReceiptInDom() {
  await document.fonts?.ready;
  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    const area = document.getElementById('receipt-print-area');
    if (!area) continue;
    const textLen = (area.innerText || '').trim().length;
    const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
    const imgs = Array.from(area.querySelectorAll('img'));
    const imgsReady =
      imgs.length === 0 || imgs.every((img) => img.complete && img.naturalWidth > 0);
    if (textLen >= 80 && h >= 120 && imgsReady) {
      return { area, textLen };
    }
  }
  const area = document.getElementById('receipt-print-area');
  const textLen = area ? (area.innerText || '').trim().length : 0;
  return { area, textLen };
}

async function trySilentPrintAfterSale(sale, html, textLen) {
  const num = sale?.receiptNumber != null ? String(sale.receiptNumber).trim() : '';

  if (
    html.length >= 40 &&
    textLen >= 80 &&
    typeof window.desktopCashier?.printReceiptHtml === 'function'
  ) {
    await window.desktopCashier.printReceiptHtml(html);
    return true;
  }

  if (num && typeof window.desktopCashier?.printReceipt === 'function') {
    await window.desktopCashier.printReceipt(num);
    return true;
  }

  return false;
}

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    if (!sale?.receiptNumber) return undefined;

    let cancelled = false;
    syncPrintCssVars(usePrintSettingsStore.getState());

    const finish = () => {
      if (!cancelled) onDoneRef.current?.();
    };

    const run = async () => {
      const { area, textLen } = await waitForReceiptInDom();
      if (cancelled) return;

      const html = area?.outerHTML?.trim() || '';

      if (typeof window.desktopCashier?.printReceiptHtml === 'function' ||
          typeof window.desktopCashier?.printReceipt === 'function') {
        try {
          const ok = await trySilentPrintAfterSale(sale, html, textLen);
          if (ok) {
            finish();
            return;
          }
        } catch (err) {
          console.warn('[Aurent] silent print after sale failed', err);
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

  const host = (
    <div className="fiscal-print-scene thermal-report-print-host" aria-hidden>
      <div id="fiscal-print-shell">
        <div className="receipt-print-root bg-white text-black">
          <FiscalReceiptBody sale={sale} />
        </div>
      </div>
    </div>
  );

  return createPortal(host, document.body);
}

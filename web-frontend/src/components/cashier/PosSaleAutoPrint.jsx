/**
 * Автопечать после продажи на десктопе.
 * 1. Чек уже в памяти (ответ API) — рендер в DOM
 * 2. printReceiptHtml → скрытое окно Electron → silent print
 * 3. При сбое — window.print (диалог Windows, всегда работает)
 */
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import { printThermalReceiptDialog } from '../../utils/printReceipt';
import { syncPrintCssVars } from '../../utils/syncPrintCssVars';
import { usePrintSettingsStore } from '../../store/printSettingsStore';

async function waitForReceiptInDom() {
  await document.fonts?.ready;
  for (let i = 0; i < 55; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    const area = document.getElementById('receipt-print-area');
    if (!area) continue;
    const textLen = (area.innerText || '').trim().length;
    const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
    const imgs = Array.from(area.querySelectorAll('img'));
    const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete && img.naturalWidth > 0);
    if (textLen >= 80 && h >= 120 && imgsReady) {
      return area;
    }
  }
  return document.getElementById('receipt-print-area');
}

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();

  useLayoutEffect(() => {
    if (!sale) return undefined;

    let cancelled = false;
    syncPrintCssVars(usePrintSettingsStore.getState());

    const run = async () => {
      const area = await waitForReceiptInDom();
      if (cancelled) return;

      const html = area?.outerHTML?.trim() || '';
      const textLen = area ? (area.innerText || '').trim().length : 0;

      if (html.length >= 40 && textLen >= 80 && typeof window.desktopCashier?.printReceiptHtml === 'function') {
        try {
          await window.desktopCashier.printReceiptHtml(html);
          if (!cancelled) onDone?.();
          return;
        } catch (err) {
          console.warn('[Aurent] printReceiptHtml after sale failed', err);
        }
      }

      if (cancelled) return;
      try {
        await printThermalReceiptDialog({ useModalShell: true });
        if (!cancelled) onDone?.();
      } catch {
        if (!cancelled) {
          toast.error(t('pos.printFailed'));
          onDone?.();
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [sale, onDone, t]);

  if (!sale) return null;

  return (
    <div className="fiscal-print-scene thermal-report-print-host" aria-hidden>
      <div id="fiscal-print-shell">
        <div className="receipt-print-root bg-white text-black">
          <FiscalReceiptBody sale={sale} />
        </div>
      </div>
    </div>
  );
}

/**
 * Автопечать после продажи: скрытый чек в DOM + модалка «Печатается чек…».
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import {
  cancelScheduledAutoPrintUnmount,
  getAutoPrintMountEl,
  scheduleAutoPrintUnmount,
  teardownAutoPrintMount,
} from '../../utils/autoPrintMount';
import { cleanupDesktopPrintState, isDesktopCashier, printThermalReceiptAuto } from '../../utils/printReceipt';

const QR_WAIT_MS = 2000;
const STRICT_REMOUNT_UNMOUNT_MS = 280;
const BEFORE_PRINT_SETTLE_MS = 450;

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

function renderReceiptIntoMount(sale) {
  const host = getAutoPrintMountEl();
  host.replaceChildren();
  const dialog = document.createElement('div');
  dialog.className = 'fiscal-print-dialog';
  const shell = document.createElement('div');
  shell.id = 'fiscal-print-shell';
  dialog.appendChild(shell);
  host.appendChild(dialog);

  const root = createRoot(shell);
  root.render(<FiscalReceiptBody sale={sale} />);
  return { root, host };
}

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  const inFlightKeyRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    const key = sale?.receiptNumber;
    if (!key) return undefined;

    // React StrictMode: второй mount не трогает DOM и не запускает вторую печать.
    if (inFlightKeyRef.current === key) {
      return undefined;
    }
    inFlightKeyRef.current = key;
    cancelScheduledAutoPrintUnmount();
    setShowOverlay(false);

    const { root } = renderReceiptIntoMount(sale);

    const run = async () => {
      await waitForQrInShell();
      if (inFlightKeyRef.current !== key) return;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (inFlightKeyRef.current !== key) return;
      // Если стартуем печать слишком рано, Electron может не увидеть готовый DOM и уйти в ретраи (3 попытки),
      // из-за чего визуально “мигает” чек/фон. Даем макету стабилизироваться.
      await new Promise((r) => setTimeout(r, BEFORE_PRINT_SETTLE_MS));
      if (inFlightKeyRef.current !== key) return;

      try {
        cancelScheduledAutoPrintUnmount();
        const mode = await printThermalReceiptAuto();
        if (inFlightKeyRef.current === key && (mode === 'silent' || mode === 'dialog')) {
          toast.success(t('receipt.printSent', { defaultValue: 'Чек отправлен на печать' }), {
            id: 'pos-auto-print',
            duration: 3000,
          });
        }
      } catch (err) {
        if (inFlightKeyRef.current === key) {
          console.warn('[Aurent] auto print failed', err);
          const msg = err?.message || t('pos.printFailed');
          const hint = t('pos.printFailedDesktopHint', {
            defaultValue: 'Aurent → «Принтер чека», затем повторите продажу.',
          });
          const showHint =
            isDesktopCashier() && !/принтер чека/i.test(msg) && !/Aurent\s*→/i.test(msg);
          toast.error(showHint ? `${msg}. ${hint}` : msg, { id: 'pos-auto-print', duration: 6000 });
        }
      } finally {
        if (inFlightKeyRef.current !== key) return;
        inFlightKeyRef.current = null;
        setShowOverlay(false);
        cleanupDesktopPrintState();
        cancelScheduledAutoPrintUnmount();
        try {
          root.unmount();
        } catch {
          /* ignore */
        }
        teardownAutoPrintMount();
        onDoneRef.current?.();
      }
    };

    run();

    return () => {
      scheduleAutoPrintUnmount(() => {
        if (inFlightKeyRef.current === key) return;
        try {
          root.unmount();
        } catch {
          /* ignore */
        }
        teardownAutoPrintMount();
      }, STRICT_REMOUNT_UNMOUNT_MS);
    };
  }, [sale?.receiptNumber, t]);

  if (!sale) return null;

  return null;
}

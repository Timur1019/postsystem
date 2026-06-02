/**
 * Автопечать после продажи: превью чека по центру экрана → silent print.
 */
import { useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';
import {
  RECEIPT_AUTO_PRINT_UI,
  RECEIPT_PRINT_DOM,
  RECEIPT_PRINT_TOAST,
} from '../../config/receiptPrintConfig';
import {
  cancelScheduledAutoPrintUnmount,
  ensureAutoPrintMountCentered,
  fiscalPrintDialogClass,
  getAutoPrintMountEl,
  scheduleAutoPrintUnmount,
  teardownAutoPrintMount,
} from '../../utils/autoPrintMount';
import { cleanupDesktopPrintState, isDesktopCashier, printThermalReceiptAuto } from '../../utils/printReceipt';
import {
  sleep,
  waitForDoubleAnimationFrame,
  waitForReceiptDomReady,
  waitForReceiptQrReady,
} from '../../utils/receiptPrintWait';

function renderReceiptIntoMount(sale) {
  const host = getAutoPrintMountEl();
  ensureAutoPrintMountCentered();
  host.replaceChildren();
  const dialog = document.createElement('div');
  dialog.className = fiscalPrintDialogClass;
  const shell = document.createElement('div');
  shell.id = RECEIPT_PRINT_DOM.fiscalPrintShellId;
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
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    const key = sale?.receiptNumber;
    if (!key) return undefined;

    if (inFlightKeyRef.current === key) {
      return undefined;
    }
    inFlightKeyRef.current = key;
    cancelScheduledAutoPrintUnmount();

    const { root } = renderReceiptIntoMount(sale);

    const run = async () => {
      ensureAutoPrintMountCentered();
      await waitForDoubleAnimationFrame();
      if (inFlightKeyRef.current !== key) return;
      await waitForReceiptDomReady({ useModalShell: true }).catch(() => undefined);
      if (inFlightKeyRef.current !== key) return;
      await waitForReceiptQrReady();
      if (inFlightKeyRef.current !== key) return;
      await waitForDoubleAnimationFrame();
      if (inFlightKeyRef.current !== key) return;
      await sleep(RECEIPT_AUTO_PRINT_UI.beforePrintSettleMs);
      if (inFlightKeyRef.current !== key) return;

      try {
        cancelScheduledAutoPrintUnmount();
        const mode = await printThermalReceiptAuto();
        if (inFlightKeyRef.current === key && (mode === 'silent' || mode === 'dialog')) {
          toast.success(t('receipt.printSent', { defaultValue: 'Чек отправлен на печать' }), {
            id: RECEIPT_PRINT_TOAST.toastId,
            duration: RECEIPT_PRINT_TOAST.successDurationMs,
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
          toast.error(showHint ? `${msg}. ${hint}` : msg, {
            id: RECEIPT_PRINT_TOAST.toastId,
            duration: RECEIPT_PRINT_TOAST.errorDurationMs,
          });
        }
      } finally {
        if (inFlightKeyRef.current !== key) return;
        await sleep(RECEIPT_AUTO_PRINT_UI.previewHoldAfterPrintMs);
        if (inFlightKeyRef.current !== key) return;
        inFlightKeyRef.current = null;
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
      }, RECEIPT_AUTO_PRINT_UI.strictModeUnmountDelayMs);
    };
  }, [sale?.receiptNumber, t]);

  if (!sale) return null;

  return null;
}

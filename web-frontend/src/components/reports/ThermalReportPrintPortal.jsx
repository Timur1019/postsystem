// src/components/reports/ThermalReportPrintPortal.jsx
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  isDesktopCashier,
  printThermalReceipt,
  printThermalReceiptDialog,
} from '../../utils/printReceipt';
import { printThermalReport, waitForPrintDialogClose } from '../../utils/printThermalReport';

/**
 * Скрытый термочек в DOM + автопечать.
 * @param {string|number} printToken — уникален для каждого запуска печати
 * @param {'auto'|'dialog'} printMode — auto: скрытое окно Electron; dialog: window.print
 * @param {string|number} [receiptNumber] — для тихой печати по номеру чека
 */
export default function ThermalReportPrintPortal({
  open,
  printToken,
  receiptNumber,
  printMode = 'auto',
  children,
  onPrinted,
  onClose,
  onError,
}) {
  const onPrintedRef = useRef(onPrinted);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  onPrintedRef.current = onPrinted;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  useLayoutEffect(() => {
    if (!open || printToken == null) return undefined;

    let cancelled = false;

    const run = async () => {
      await document.fonts?.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      let shell = null;
      for (let i = 0; i < 50 && !cancelled; i += 1) {
        shell = document.getElementById('fiscal-print-shell');
        const area =
          document.getElementById('receipt-print-area') ||
          shell;
        const textLen = area ? (area.innerText || '').trim().length : 0;
        const h = area
          ? Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height)
          : 0;
        const imgsReady = Array.from(document.images).every((img) => img.complete);
        if (shell && textLen >= 80 && h >= 120 && imgsReady) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;
      if (!shell && printMode !== 'auto') {
        onErrorRef.current?.(new Error('Чек не успел подготовиться для печати'));
        onCloseRef.current?.();
        return;
      }

      try {
        let mode = 'dialog';
        if (printMode === 'dialog') {
          mode = await printThermalReceiptDialog({ useModalShell: true });
        } else if (isDesktopCashier()) {
          mode = await printThermalReceipt({
            useModalShell: true,
            receiptNumber: receiptNumber ?? printToken,
          });
        } else {
          mode = await printThermalReport();
        }
        if (mode === 'dialog') {
          await waitForPrintDialogClose();
        }
        if (!cancelled) {
          onPrintedRef.current?.();
          onCloseRef.current?.();
        }
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current?.(err);
          onCloseRef.current?.();
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [open, printToken, printMode, receiptNumber]);

  if (!open || !children) return null;

  const host = (
    <div className="fiscal-print-scene thermal-report-print-host" aria-hidden>
      <div className="fiscal-print-dialog">
        <div id="fiscal-print-shell">
          <div className="receipt-print-root bg-white text-black">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(host, document.body);
}

// src/components/reports/ThermalReportPrintPortal.jsx
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isDesktopCashier, printThermalReceipt } from '../../utils/printReceipt';
import { printThermalReport, waitForPrintDialogClose } from '../../utils/printThermalReport';

/**
 * Скрытый термочек в DOM + автопечать (как фискальный чек).
 * @param {string|number} printToken — уникален для каждого запуска печати
 */
export default function ThermalReportPrintPortal({
  open,
  printToken,
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
      for (let i = 0; i < 40 && !cancelled; i += 1) {
        shell = document.getElementById('fiscal-print-shell');
        if (shell && shell.scrollHeight >= 8) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;
      if (!shell) {
        onErrorRef.current?.(new Error('Чек не успел подготовиться для печати'));
        onCloseRef.current?.();
        return;
      }

      try {
        const mode = isDesktopCashier()
          ? await printThermalReceipt({ useModalShell: true })
          : await printThermalReport();
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
  }, [open, printToken]);

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

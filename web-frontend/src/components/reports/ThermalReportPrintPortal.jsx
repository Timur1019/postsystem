// src/components/reports/ThermalReportPrintPortal.jsx
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { printThermalReport, waitForPrintDialogClose } from '../../utils/printThermalReport';

/**
 * Скрытый термочек в DOM + автопечать (как фискальный чек).
 * @param {string|number} printToken — уникален для каждого запуска печати
 */
export default function ThermalReportPrintPortal({ open, printToken, children, onPrinted, onClose }) {
  const onPrintedRef = useRef(onPrinted);
  const onCloseRef = useRef(onClose);
  onPrintedRef.current = onPrinted;
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open || printToken == null) return undefined;

    let cancelled = false;

    const run = async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;
      if (!document.getElementById('fiscal-print-shell')) return;

      try {
        await printThermalReport();
        await waitForPrintDialogClose();
        if (!cancelled) {
          onPrintedRef.current?.();
          onCloseRef.current?.();
        }
      } catch {
        if (!cancelled) onCloseRef.current?.();
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

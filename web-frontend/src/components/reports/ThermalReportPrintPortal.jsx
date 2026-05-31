// src/components/reports/ThermalReportPrintPortal.jsx
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  isDesktopCashier,
  printDesktopReceiptSale,
  printDesktopShiftReport,
  printThermalReceiptDialog,
} from '../../utils/printReceipt';
import { printThermalReport, waitForPrintDialogClose } from '../../utils/printThermalReport';

/**
 * Скрытый термочек в DOM + автопечать (только веб-браузер).
 * На десктопе — только Electron IPC, без window.print.
 */
export default function ThermalReportPrintPortal({
  open,
  printToken,
  receiptNumber,
  sale = null,
  shiftReport = null,
  printMode = 'auto',
  children,
  onPrinted,
  onClose,
  onError,
}) {
  const { t } = useTranslation();
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
      if (isDesktopCashier()) {
        try {
          if (shiftReport?.reportType) {
            const result = await printDesktopShiftReport(shiftReport, t);
            if (!result.ok) {
              throw new Error(t('receipt.printFailed'));
            }
          } else if (sale?.receiptNumber) {
            const result = await printDesktopReceiptSale(sale);
            if (!result.ok) {
              throw new Error(t('receipt.printFailed'));
            }
          } else {
            throw new Error(t('receipt.printFailed'));
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
        return;
      }

      await document.fonts?.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      let shell = null;
      for (let i = 0; i < 50 && !cancelled; i += 1) {
        shell = document.getElementById('fiscal-print-shell');
        const area = document.getElementById('receipt-print-area') || shell;
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
  }, [open, printToken, printMode, receiptNumber, sale, shiftReport, t]);

  if (!open || !children || isDesktopCashier()) return null;

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

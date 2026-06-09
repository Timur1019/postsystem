// src/components/reports/ThermalReportPrintPortal.jsx
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ReceiptPrintingOverlay from './ReceiptPrintingOverlay';
import { printThermalReceiptDialog } from '../../utils/printReceipt';
import { printThermalReport } from '../../utils/printThermalReport';
import {
  isCashierEscposPrintAvailable,
  isCashierEscposReportPrintAvailable,
  printThermalDocument,
  resolveEscposPrintErrorMessage,
} from '../../services/cashierEscpos';

/**
 * Скрытый термочек в DOM + печать; на экране — модалка «Печатается…».
 * Desktop: ESC/POS (чек / Z / X-Z); браузер: window.print().
 */
export default function ThermalReportPrintPortal({
  open,
  printToken,
  receiptNumber: _receiptNumber,
  sale: _sale,
  zReport = null,
  shiftReport = null,
  printMode = 'auto',
  overlayTitle,
  overlayHint,
  children,
  onPrinted,
  onClose,
  onError,
}) {
  const { t } = useTranslation();
  const [showOverlay, setShowOverlay] = useState(false);
  const onPrintedRef = useRef(onPrinted);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  onPrintedRef.current = onPrinted;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  const isShift = Boolean(shiftReport?.reportType);
  const isZArchive = Boolean(zReport);
  const canEscpos =
    (_sale && isCashierEscposPrintAvailable()) ||
    ((zReport || shiftReport) && isCashierEscposReportPrintAvailable());
  const defaultTitle = isShift || isZArchive
    ? t('receipt.printingReportTitle', { defaultValue: 'Печатается отчёт…' })
    : t('receipt.printingTitle', { defaultValue: 'Печатается чек…' });

  useLayoutEffect(() => {
    if (!open || printToken == null) {
      setShowOverlay(false);
      return undefined;
    }

    let cancelled = false;
    setShowOverlay(true);

    const run = async () => {
      if (canEscpos) {
        try {
          await printThermalDocument({
            sale: _sale,
            z: zReport,
            shiftReport,
            t,
            useModalShell: true,
          });
          if (!cancelled) {
            onPrintedRef.current?.();
            onCloseRef.current?.();
          }
        } catch (err) {
          if (!cancelled) {
            onErrorRef.current?.(new Error(resolveEscposPrintErrorMessage(err, t)));
            onCloseRef.current?.();
          }
        } finally {
          if (!cancelled) setShowOverlay(false);
        }
        return;
      }

      await document.fonts?.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      let shell = null;
      for (let i = 0; i < 50 && !cancelled; i += 1) {
        shell = document.getElementById('fiscal-print-shell');
        const area =
          document.getElementById('receipt-print-area') ||
          shell?.querySelector('.receipt-print-root') ||
          shell;
        const textLen = area ? (area.innerText || '').trim().length : 0;
        const h = area
          ? Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height)
          : 0;
        const minText = isShift || isZArchive ? 12 : 20;
        const minH = isShift || isZArchive ? 40 : 80;
        const imgs = Array.from(area?.querySelectorAll('img') ?? []).filter((img) => {
          const host = document.getElementById('fiscal-print-shell');
          return host?.contains(img);
        });
        const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete);
        if (shell && textLen >= minText && h >= minH && imgsReady) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;
      if (!shell && printMode !== 'auto') {
        onErrorRef.current?.(new Error('Документ не успел подготовиться для печати'));
        onCloseRef.current?.();
        return;
      }

      try {
        if (printMode === 'dialog' || isShift || isZArchive) {
          await printThermalReceiptDialog({ useModalShell: true });
        } else {
          await printThermalReport();
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
      } finally {
        if (!cancelled) setShowOverlay(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      setShowOverlay(false);
    };
  }, [open, printToken, printMode, isShift, isZArchive, _sale, zReport, shiftReport, canEscpos, t]);

  if (!open || !children) return null;

  const host = (
    <div className="fiscal-print-scene fiscal-print-scene--offscreen thermal-report-print-host" aria-hidden>
      <div className="fiscal-print-dialog">
        <div id="fiscal-print-shell">
          <div className="receipt-print-root bg-white text-black">{children}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ReceiptPrintingOverlay
        open={showOverlay}
        title={overlayTitle ?? defaultTitle}
        hint={overlayHint}
      />
      {createPortal(host, document.body)}
    </>
  );
}

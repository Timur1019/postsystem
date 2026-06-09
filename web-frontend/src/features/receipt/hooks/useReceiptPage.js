import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { saleApi } from '../../../services/api';
import { POS_RECEIPT_PRINT_EVENT } from '../../../utils/printWithHtmlClass';
import { printReceiptDialog } from '../../../utils/printReceipt';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { fmtMoney, splitDateTime } from '../../../utils/fiscalReceiptFormat';

export function useReceiptPage() {
  const { t } = useTranslation();
  const { receiptNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const autoPrintedRef = useRef(false);

  const silentJob = searchParams.get('silent') === '1';
  const autoPrint =
    !silentJob &&
    (location.state?.autoPrint === true || searchParams.get('print') === '1');
  const fromCashier = location.state?.fromCashier === true || user?.role === 'CASHIER';

  const { data: sale, isLoading } = useQuery({
    queryKey: ['receipt', receiptNumber],
    queryFn: () => saleApi.getReceipt(receiptNumber).then((r) => r.data),
  });

  const runPrint = useCallback(async () => {
    try {
      if (isCashierEscposPrintAvailable() && sale) {
        await printFiscalReceipt({ sale, t, useModalShell: false });
      } else {
        await printReceiptDialog(receiptNumber);
      }
      toast.success(t('receipt.printSent'), { id: 'receipt-print' });
    } catch (e) {
      const msg =
        isCashierEscposPrintAvailable() && sale
          ? resolveEscposPrintErrorMessage(e, t)
          : e?.message ?? t('receipt.printFailed');
      toast.error(msg, { id: 'receipt-print' });
    }
  }, [receiptNumber, sale, t]);

  useEffect(() => {
    window.addEventListener(POS_RECEIPT_PRINT_EVENT, runPrint);
    return () => window.removeEventListener(POS_RECEIPT_PRINT_EVENT, runPrint);
  }, [runPrint]);

  useEffect(() => {
    if (!sale) return undefined;
    if (silentJob) {
      let cancelled = false;
      const signalReady = async () => {
        await document.fonts?.ready;
        for (let i = 0; i < 30 && !cancelled; i += 1) {
          await new Promise((r) => setTimeout(r, 100));
          const area = document.getElementById('receipt-print-area');
          const textLen = area ? (area.innerText || '').trim().length : 0;
          const h = area
            ? Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height)
            : 0;
          const imgs = Array.from(document.images);
          const imgsReady = imgs.every((img) => img.complete);
          if (textLen >= 80 && h >= 120 && imgsReady) {
            break;
          }
        }
        if (cancelled) return;
        window.__posReceiptReady = true;
        window.dispatchEvent(new CustomEvent('pos-receipt-ready'));
      };
      signalReady();
      return () => {
        cancelled = true;
      };
    }
    if (!autoPrint || autoPrintedRef.current) return undefined;
    autoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      runPrint();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [sale, autoPrint, silentJob, runPrint]);

  const backTarget = fromCashier ? '/cashier/pos' : '/dashboard';
  const headerWidthCls =
    'w-full max-w-[min(640px,calc(var(--print-paper-w,80mm)+8rem))]';
  const dateTime = sale?.createdAt ? splitDateTime(sale.createdAt) : null;
  const totalLabel =
    sale?.totalAmount != null
      ? `${fmtMoney(sale.totalAmount)} ${t('fiscalReceipt.currency')}`
      : null;
  const receiptShortNumber = sale?.receiptNumber || receiptNumber;

  return {
    t,
    sale,
    isLoading,
    silentJob,
    fromCashier,
    settingsOpen,
    setSettingsOpen,
    runPrint,
    navigate,
    backTarget,
    headerWidthCls,
    dateTime,
    totalLabel,
    receiptShortNumber,
  };
}

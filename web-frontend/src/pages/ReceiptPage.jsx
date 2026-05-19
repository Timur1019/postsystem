// src/pages/ReceiptPage.jsx
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { saleApi } from '../services/api';
import { ArrowLeft, Printer, Settings2 } from 'lucide-react';
import { POS_RECEIPT_PRINT_EVENT } from '../utils/printWithHtmlClass';
import { printReceiptDialog } from '../utils/printReceipt';
import toast from 'react-hot-toast';
import ThermalPrintSettingsPanel from '../components/receipt/ThermalPrintSettingsPanel';
import FiscalReceiptBody from '../components/receipt/FiscalReceiptBody';
import { useAuthStore } from '../store/authStore';

export default function ReceiptPage() {
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
      const mode = await printReceiptDialog(receiptNumber);
      if (mode === 'silent') {
        toast.success(t('receipt.printSent'), { id: 'receipt-print' });
      }
    } catch (e) {
      toast.error(e?.message ?? t('receipt.printFailed'), { id: 'receipt-print' });
    }
  }, [receiptNumber, t]);

  useEffect(() => {
    window.addEventListener(POS_RECEIPT_PRINT_EVENT, runPrint);
    return () => window.removeEventListener(POS_RECEIPT_PRINT_EVENT, runPrint);
  }, [runPrint]);

  useEffect(() => {
    if (!sale) return undefined;
    if (silentJob) {
      window.__posReceiptReady = true;
      window.dispatchEvent(new CustomEvent('pos-receipt-ready'));
      return () => {
        window.__posReceiptReady = false;
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

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">{t('receipt.loading')}</div>
    );
  }
  if (!sale) {
    return <div className="py-10 text-center text-slate-400">{t('receipt.notFound')}</div>;
  }

  if (silentJob) {
    return (
      <div className="receipt-page receipt-page--silent min-h-0 bg-white p-0">
        <FiscalReceiptBody sale={sale} />
      </div>
    );
  }

  return (
    <div className="receipt-page min-h-screen overflow-x-hidden bg-slate-100 px-2 py-3 dark:bg-slate-950">
      <div className="sticky top-0 z-20 mx-auto mb-3 flex w-full max-w-[var(--print-paper-w,80mm)] flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/95 py-2 backdrop-blur print:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <button
          type="button"
          onClick={() => navigate(backTarget)}
          className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          {fromCashier ? t('receipt.backCashier') : t('receipt.backPos')}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              settingsOpen
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Settings2 size={16} />
            {t('printSettings.toggle')}
          </button>
          <button
            type="button"
            onClick={() => runPrint()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Printer size={16} />
            {t('receipt.print')}
          </button>
        </div>
      </div>

      {settingsOpen ? (
        <div className="mx-auto mb-3 w-full max-w-[var(--print-paper-w,80mm)] print:hidden">
          <ThermalPrintSettingsPanel />
        </div>
      ) : null}

      <div className="receipt-page__paper mx-auto w-full">
        <div className="receipt-page__card overflow-hidden rounded-sm bg-white p-0 text-black shadow-md print:rounded-none print:shadow-none dark:bg-white dark:text-black">
          <FiscalReceiptBody sale={sale} />
        </div>
      </div>
    </div>
  );
}

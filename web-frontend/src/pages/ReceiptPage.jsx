// src/pages/ReceiptPage.jsx
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { saleApi } from '../services/api';
import { ArrowLeft, Printer, Settings2, Receipt } from 'lucide-react';
import { POS_RECEIPT_PRINT_EVENT } from '../utils/printWithHtmlClass';
import { printReceiptDialog } from '../utils/printReceipt';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../services/cashierEscpos';
import toast from 'react-hot-toast';
import ThermalPrintSettingsPanel from '../components/receipt/ThermalPrintSettingsPanel';
import FiscalReceiptBody from '../components/receipt/FiscalReceiptBody';
import { useAuthStore } from '../store/authStore';
import { fmtMoney, splitDateTime } from '../utils/fiscalReceiptFormat';

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

  const headerWidthCls =
    'w-full max-w-[min(640px,calc(var(--print-paper-w,80mm)+8rem))]';
  const dateTime = sale.createdAt ? splitDateTime(sale.createdAt) : null;
  const totalLabel = sale?.totalAmount != null
    ? `${fmtMoney(sale.totalAmount)} ${t('fiscalReceipt.currency')}`
    : null;
  const receiptShortNumber = sale?.receiptNumber || receiptNumber;

  return (
    <div className="receipt-page min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 to-slate-100 px-3 py-4 dark:from-slate-950 dark:to-slate-900">
      <div className={`sticky top-2 z-20 mx-auto mb-4 ${headerWidthCls} print:hidden`}>
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm shadow-slate-200/50 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/30">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(backTarget)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={15} />
              {fromCashier ? t('receipt.backCashier') : t('receipt.backPos')}
            </button>

            <div className="ml-1 flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Receipt size={18} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {t('receipt.receiptNo')} {receiptShortNumber}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {dateTime ? `${dateTime.date} · ${dateTime.time}` : ''}
                  {totalLabel ? (dateTime ? ' · ' : '') + totalLabel : ''}
                </p>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  settingsOpen
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-expanded={settingsOpen}
              >
                <Settings2 size={15} />
                <span className="hidden sm:inline">{t('printSettings.toggle')}</span>
              </button>
              <button
                type="button"
                onClick={() => runPrint()}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                <Printer size={15} />
                {t('receipt.print')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {settingsOpen ? (
        <div className={`mx-auto mb-3 ${headerWidthCls} print:hidden`}>
          <ThermalPrintSettingsPanel />
        </div>
      ) : null}

      <div className="receipt-page__paper mx-auto w-full">
        <div className="receipt-page__card overflow-hidden rounded-md bg-white p-0 text-black shadow-lg ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 dark:bg-white dark:text-black dark:ring-slate-700">
          <FiscalReceiptBody sale={sale} />
        </div>
      </div>
    </div>
  );
}

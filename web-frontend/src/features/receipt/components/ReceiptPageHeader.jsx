import { ArrowLeft, Printer, Settings2, Receipt } from 'lucide-react';

export default function ReceiptPageHeader({
  t,
  fromCashier,
  backTarget,
  navigate,
  receiptShortNumber,
  dateTime,
  totalLabel,
  headerWidthCls,
  settingsOpen,
  setSettingsOpen,
  runPrint,
}) {
  return (
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
  );
}

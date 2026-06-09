import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api';
import { fmtMoney } from '../../../utils/formatMoney';
import PeriodCompareDelta from '../components/PeriodCompareDelta';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { usePeriodCompareReportPage } from '../hooks/usePeriodCompareReportPage';

export default function PeriodCompareReportPage() {
  const { t } = useTranslation();
  const r = usePeriodCompareReportPage();

  const cards = [
    { label: t('stockReports.kpiRevenue'), cur: r.data?.current?.revenue, prev: r.data?.previous?.revenue, delta: r.data?.deltas?.revenueDelta, pct: r.data?.deltas?.revenueDeltaPercent },
    { label: t('stockReports.colReceipts'), cur: r.data?.current?.receiptCount, prev: r.data?.previous?.receiptCount, delta: r.data?.deltas?.receiptCountDelta, pct: r.data?.deltas?.receiptCountDeltaPercent, money: false },
    { label: t('stockReports.kpiSold'), cur: r.data?.current?.itemsSold, prev: r.data?.previous?.itemsSold, delta: r.data?.deltas?.itemsSoldDelta, pct: r.data?.deltas?.itemsSoldDeltaPercent, money: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.periodCompareTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.periodCompareSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportPeriodCompare(r.exportParams)}
          filenamePrefix="period_compare"
          disabled={!r.rangeEnabled}
        />
      </div>
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
      <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.setStoreId} />
      {r.data && (
        <p className="text-xs text-slate-500">
          {t('stockReports.periodPrev')}: {r.data.previousFrom} — {r.data.previousTo}
        </p>
      )}
      {r.isPending && <p className="text-slate-500">{t('common.loading')}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.money === false ? c.cur : fmtMoney(c.cur)}</p>
            <p className="mt-1 text-xs text-slate-500">{t('stockReports.periodWas')}: {c.money === false ? c.prev : fmtMoney(c.prev)}</p>
            {r.data && (
              <div className="mt-2">
                {c.money === false ? (
                  <span className={Number(c.delta) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {c.delta > 0 ? '+' : ''}{c.delta} ({c.pct}%)
                  </span>
                ) : (
                  <PeriodCompareDelta value={c.delta} pct={c.pct} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { reportApi, storeApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import ReportExportButton from '../../components/reports/ReportExportButton';
import { fmtMoney } from '../../utils/formatMoney';

function Delta({ value, pct }) {
  const up = Number(value) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const cls = up ? 'text-emerald-600' : 'text-red-600';
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${cls}`}>
      <Icon size={14} />
      {fmtMoney(value)} ({pct}%)
    </span>
  );
}

export default function PeriodCompareReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [storeId, setStoreId] = useState('');

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      from, to,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, storeId]
  );

  const exportParams = params;

  const { data, isPending } = useQuery({
    queryKey: ['reports-period-compare', params],
    queryFn: () => reportApi.periodCompare(params).then((r) => r.data),
    enabled: !!from && !!to,
  });

  const cards = [
    { label: t('stockReports.kpiRevenue'), cur: data?.current?.revenue, prev: data?.previous?.revenue, delta: data?.deltas?.revenueDelta, pct: data?.deltas?.revenueDeltaPercent },
    { label: t('stockReports.colReceipts'), cur: data?.current?.receiptCount, prev: data?.previous?.receiptCount, delta: data?.deltas?.receiptCountDelta, pct: data?.deltas?.receiptCountDeltaPercent, money: false },
    { label: t('stockReports.kpiSold'), cur: data?.current?.itemsSold, prev: data?.previous?.itemsSold, delta: data?.deltas?.itemsSoldDelta, pct: data?.deltas?.itemsSoldDeltaPercent, money: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.periodCompareTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.periodCompareSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportPeriodCompare(exportParams)}
          filenamePrefix="period_compare"
          disabled={!from || !to}
        />
      </div>
      <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <select
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="">{t('stockReports.allStores')}</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {data && (
        <p className="text-xs text-slate-500">
          {t('stockReports.periodPrev')}: {data.previousFrom} — {data.previousTo}
        </p>
      )}
      {isPending && <p className="text-slate-500">{t('common.loading')}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.money === false ? c.cur : fmtMoney(c.cur)}</p>
            <p className="mt-1 text-xs text-slate-500">{t('stockReports.periodWas')}: {c.money === false ? c.prev : fmtMoney(c.prev)}</p>
            {data && (
              <div className="mt-2">
                {c.money === false ? (
                  <span className={Number(c.delta) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {c.delta > 0 ? '+' : ''}{c.delta} ({c.pct}%)
                  </span>
                ) : (
                  <Delta value={c.delta} pct={c.pct} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

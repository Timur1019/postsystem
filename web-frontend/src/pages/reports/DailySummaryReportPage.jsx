import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { reportApi } from '../../services/api';
import ReportExportButton from '../../components/reports/ReportExportButton';
import { fmtMoney } from '../../utils/formatMoney';

export default function DailySummaryReportPage() {
  const { t } = useTranslation();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isPending } = useQuery({
    queryKey: ['reports-daily', date],
    queryFn: () => reportApi.daily({ date }).then((r) => r.data),
  });

  const cards = [
    { label: t('stockReports.kpiRevenue'), value: fmtMoney(data?.totalRevenue) },
    { label: t('stockReports.colReceipts'), value: data?.transactionCount ?? '—' },
    { label: t('stockReports.kpiSold'), value: `${data?.itemsSold ?? 0} ${t('stockReports.unitsSuffix')}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.dailySummaryTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.dailySummarySubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportDaily({ date })}
          filenamePrefix="daily_summary"
        />
      </div>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      {isPending && <p className="text-slate-500">{t('common.loading')}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { reportApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import ReportExportButton from '../../components/reports/ReportExportButton';
import { fmtMoney } from '../../utils/formatMoney';

export default function CashierPerformanceReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data = [], isPending } = useQuery({
    queryKey: ['cashier-perf-report', from, to],
    queryFn: () => reportApi.cashierPerf(from, to).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.cashierPerfTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.cashierPerfSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportCashierPerf(from, to)}
          filenamePrefix="cashier_performance"
          disabled={!from || !to}
        />
      </div>
      <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colCashier')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colRevenue')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={2} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!isPending && data.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {data.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{r.cashierName ?? r.name}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

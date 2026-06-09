import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import { useCashierPerformanceReportPage } from '../hooks/useCashierPerformanceReportPage';

export default function CashierPerformanceReportPage() {
  const { t } = useTranslation();
  const r = useCashierPerformanceReportPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.cashierPerfTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.cashierPerfSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportCashierPerf(r.from, r.to)}
          filenamePrefix="cashier_performance"
          disabled={!r.rangeEnabled}
        />
      </div>
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colCashier')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colRevenue')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={2} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{row.cashierName ?? row.name}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

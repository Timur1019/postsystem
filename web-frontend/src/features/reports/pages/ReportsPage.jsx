import { useTranslation } from 'react-i18next';
import ReportsDateToolbar from '../components/sales-dashboard/ReportsDateToolbar';
import ReportsSummaryCards from '../components/sales-dashboard/ReportsSummaryCards';
import ReportsDailyChart from '../components/sales-dashboard/ReportsDailyChart';
import ReportsTopProductsPanel from '../components/sales-dashboard/ReportsTopProductsPanel';
import ReportsCashierPerfPanel from '../components/sales-dashboard/ReportsCashierPerfPanel';
import { useReportsPage } from '../hooks/useReportsPage';

export default function ReportsPage() {
  const { t } = useTranslation();
  const r = useReportsPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('reports.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('reports.subtitle')}</p>
      </div>

      <ReportsDateToolbar
        t={t}
        from={r.from}
        to={r.to}
        onFromChange={r.setFrom}
        onToChange={r.setTo}
        presets={r.presets}
        onPreset={r.applyPreset}
      />

      <ReportsSummaryCards t={t} cards={r.summaryCards} isLoading={r.isLoading} />

      <ReportsDailyChart
        t={t}
        data={r.report?.dailyBreakdown}
        formatCurrency={r.formatCurrency}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportsTopProductsPanel
          t={t}
          products={r.topProducts}
          formatCurrency={r.formatCurrency}
        />
        <ReportsCashierPerfPanel
          t={t}
          cashierPerf={r.cashierPerf}
          formatCurrency={r.formatCurrency}
        />
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../../../utils/apiError';
import StockDashboardFilters from '../components/stock-dashboard/StockDashboardFilters';
import StockDashboardKpiGrid from '../components/stock-dashboard/StockDashboardKpiGrid';
import StockDashboardChart from '../components/stock-dashboard/StockDashboardChart';
import StockDashboardQuickLinks from '../components/stock-dashboard/StockDashboardQuickLinks';
import { useStockDashboardPage } from '../hooks/useStockDashboardPage';
import { buildStockDashboardCards, buildStockDashboardChartData } from '../utils/stockDashboardCards';

export default function StockDashboardPage() {
  const { t } = useTranslation();
  const p = useStockDashboardPage();

  const formatUnits = (units) => {
    if (p.isLoading) return '…';
    if (p.isError) return '—';
    return units ?? 0;
  };

  const cards = buildStockDashboardCards(t, p.data);
  const chartData = buildStockDashboardChartData(p.data?.dailyBreakdown);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.dashboardTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.dashboardSubtitle')}</p>
      </div>

      <StockDashboardFilters
        t={t}
        from={p.from}
        to={p.to}
        onFrom={p.setFrom}
        onTo={p.setTo}
        storeId={p.storeId}
        onStoreChange={p.setStoreId}
        stores={p.stores}
      />

      <StockDashboardKpiGrid
        cards={cards}
        formatUnits={formatUnits}
        t={t}
        isLoading={p.isLoading}
        isError={p.isError}
      />

      {p.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {getApiErrorMessage(p.error, t('stockReports.loadError'))}
        </p>
      )}

      <StockDashboardChart t={t} chartData={chartData} />

      <StockDashboardQuickLinks t={t} />
    </div>
  );
}

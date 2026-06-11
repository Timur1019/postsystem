import { PageLayout, ErrorBanner } from '../../../components/ui';
import FinanceListFilters from '../components/FinanceListFilters';
import FinanceKpiCard from '../components/dashboard/FinanceKpiCard';
import FinanceRecentTransactions from '../components/dashboard/FinanceRecentTransactions';
import FinanceDailyChart from '../components/dashboard/FinanceDailyChart';
import { useFinanceDashboardPage } from '../hooks/useFinanceDashboardPage';
import { formatMoney } from '../utils/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/dashboard.css';

export default function FinanceDashboardPage() {
  const p = useFinanceDashboardPage();

  return (
    <PageLayout title={p.t('finance.dashboard.title')} subtitle={p.t('finance.dashboard.subtitle')}>
      <div className="finance-page finance-page--dashboard">
        <FinanceListFilters
          t={p.t}
          from={p.filters.from}
          setFrom={p.filters.setFrom}
          to={p.filters.to}
          setTo={p.filters.setTo}
          onReset={p.filters.resetFilters}
        />

        {p.query.isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}
        {p.query.isLoading ? (
          <p className="finance-loading">{p.t('common.loading')}</p>
        ) : null}

        {p.integrationKpis.length > 0 ? (
          <div className="finance-integration-kpis">
            {p.integrationKpis.map((item) => (
              <div key={item.label} className="finance-integration-kpi">
                <p className="finance-integration-kpi__label">{item.label}</p>
                <p className="finance-integration-kpi__value">{item.value}</p>
                <p className="finance-integration-kpi__hint">{item.hint}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="finance-kpi-grid">
          {p.kpis.map((kpi) => (
            <FinanceKpiCard key={kpi.title} title={kpi.title} value={kpi.value} tone={kpi.tone} />
          ))}
        </div>

        {p.last7Days.length > 0 || p.recentTransactions.length > 0 ? (
          <div className="finance-dashboard-panels">
            <FinanceDailyChart days={p.last7Days} t={p.t} title={p.chartTitle} />
            <FinanceRecentTransactions items={p.recentTransactions} t={p.t} />
          </div>
        ) : null}

        {p.topExpenses.length > 0 ? (
          <section className="finance-top-expenses">
            <h2 className="finance-top-expenses__title">{p.t('finance.dashboard.topExpenses')}</h2>
            <ul className="finance-top-expenses__list">
              {p.topExpenses.map((item) => (
                <li key={item.categoryName} className="finance-top-expenses__item">
                  <span>{item.categoryName}</span>
                  <span className="finance-top-expenses__amount">{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageLayout>
  );
}

import TablePagination from '../../../components/shared/TablePagination';
import { ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceListFilters from '../components/FinanceListFilters';
import { financeApi } from '../../../api';
import ReportExportButton from '../../reports/components/ReportExportButton';
import { useClientTablePagination } from '../hooks/useClientTablePagination';
import { useFinanceReportsPage } from '../hooks/useFinanceReportsPage';
import { formatMoney } from '../utils/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/reports.css';

function BreakdownList({ title, items, pagination }) {
  if (!items?.length) return null;

  return (
    <section className="finance-report-breakdown">
      <div className="finance-report-breakdown__header">
        <h3>{title}</h3>
      </div>
      <div className="finance-report-breakdown__table">
        {pagination.rows.map((line) => (
          <div key={line.name || line.date} className="finance-report-breakdown__row">
            <span>{line.name || line.date}</span>
            <span>{formatMoney(line.amount ?? line.net)}</span>
          </div>
        ))}
      </div>
      {pagination.total > pagination.pageSize ? (
        <TablePagination
          className="finance-pagination !border-0 !px-0"
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      ) : null}
    </section>
  );
}

export default function FinanceReportsPage() {
  const p = useFinanceReportsPage();
  const pl = p.profitLossQuery.data;
  const cf = p.cashFlowQuery.data;
  const isError = p.profitLossQuery.isError || p.cashFlowQuery.isError;

  const expensePagination = useClientTablePagination(
    pl?.expenseByCategory ?? [],
    { initialPageSize: 10, resetKey: `${p.tab}-${p.from}-${p.to}` },
  );

  const dailyPagination = useClientTablePagination(
    cf?.daily ?? [],
    { initialPageSize: 10, resetKey: `${p.tab}-${p.from}-${p.to}` },
  );

  return (
    <PageLayout
      title={p.t('finance.reports.title')}
      subtitle={p.tab === 'cashFlow' ? p.t('finance.reports.cashFlow') : p.t('finance.reports.profitLoss')}
      actions={(
        <ReportExportButton
          fetchBlob={() => (
            p.tab === 'cashFlow'
              ? financeApi.reports.exportCashFlow({ from: p.from, to: p.to })
              : financeApi.reports.exportProfitLoss({ from: p.from, to: p.to })
          )}
          filenamePrefix={p.tab === 'cashFlow' ? 'cash-flow' : 'profit-loss'}
        />
      )}
    >
      <div className="finance-page">
        <div className="finance-tabs">
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'profitLoss' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('profitLoss')}
          >
            {p.t('finance.reports.profitLoss')}
          </button>
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'cashFlow' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('cashFlow')}
          >
            {p.t('finance.reports.cashFlow')}
          </button>
        </div>

        <FinanceListFilters
          t={p.t}
          from={p.from}
          setFrom={p.setFrom}
          to={p.to}
          setTo={p.setTo}
          onReset={p.resetFilters}
        />

        {isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

        {p.tab === 'profitLoss' && pl ? (
          <div className="finance-report-summary">
            <div className="finance-report-summary__row finance-report-summary__row--income">
              <span>{p.t('finance.reports.totalIncome')}</span>
              <strong>{formatMoney(pl.totalIncome)}</strong>
            </div>
            <div className="finance-report-summary__row finance-report-summary__row--expense">
              <span>{p.t('finance.reports.totalExpense')}</span>
              <strong>{formatMoney(pl.totalExpense)}</strong>
            </div>
            <div className="finance-report-summary__row finance-report-summary__row--profit">
              <span>{p.t('finance.reports.netProfit')}</span>
              <strong>{formatMoney(pl.netProfit)}</strong>
            </div>
            <BreakdownList
              title={p.t('finance.reports.expenseByCategory')}
              items={pl.expenseByCategory}
              pagination={expensePagination}
            />
          </div>
        ) : null}

        {p.tab === 'cashFlow' && cf ? (
          <div className="finance-report-summary">
            <div className="finance-report-summary__row finance-report-summary__row--income">
              <span>{p.t('finance.reports.cashInflows')}</span>
              <strong>{formatMoney(cf.totalInflows)}</strong>
            </div>
            <div className="finance-report-summary__row finance-report-summary__row--expense">
              <span>{p.t('finance.reports.cashOutflows')}</span>
              <strong>{formatMoney(cf.totalOutflows)}</strong>
            </div>
            <div className="finance-report-summary__row finance-report-summary__row--profit">
              <span>{p.t('finance.reports.netCashFlow')}</span>
              <strong>{formatMoney(cf.netCashFlow)}</strong>
            </div>
            <div className="finance-report-summary__row">
              <span>{p.t('finance.reports.internalTransfers')}</span>
              <strong>{formatMoney(cf.totalTransfers)}</strong>
            </div>
            <BreakdownList
              title={p.t('finance.reports.dailyCashFlow')}
              items={cf.daily}
              pagination={dailyPagination}
            />
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}

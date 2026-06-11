import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useFinanceDateFilters } from './useFinanceDateFilters';
import { formatMoney } from '../utils/formatMoney';

export function useFinanceDashboardPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const filters = useFinanceDateFilters();
  const hasPeriod = Boolean(filters.from && filters.to);

  const queryParams = hasPeriod ? { from: filters.from, to: filters.to } : {};

  const query = useQuery({
    queryKey: tenantKey('finance-dashboard', queryParams),
    queryFn: () => financeApi.dashboard(queryParams).then((r) => r.data),
    enabled: tenantReady,
  });

  const d = query.data;

  const kpis = d ? (hasPeriod ? [
    { title: t('finance.dashboard.periodRevenue'), value: formatMoney(d.revenueMonth), tone: 'income' },
    { title: t('finance.dashboard.periodExpenses'), value: formatMoney(d.expensesMonth), tone: 'expense' },
    { title: t('finance.dashboard.periodNetProfit'), value: formatMoney(d.netProfitMonth), tone: 'profit' },
    { title: t('finance.dashboard.cashInRegisters'), value: formatMoney(d.cashInRegisters), tone: 'neutral' },
    { title: t('finance.dashboard.moneyInBanks'), value: formatMoney(d.moneyInBanks), tone: 'neutral' },
  ] : [
    { title: t('finance.dashboard.revenueToday'), value: formatMoney(d.revenueToday), tone: 'income' },
    { title: t('finance.dashboard.revenueMonth'), value: formatMoney(d.revenueMonth), tone: 'income' },
    { title: t('finance.dashboard.expensesMonth'), value: formatMoney(d.expensesMonth), tone: 'expense' },
    { title: t('finance.dashboard.netProfit'), value: formatMoney(d.netProfitMonth), tone: 'profit' },
    { title: t('finance.dashboard.cashInRegisters'), value: formatMoney(d.cashInRegisters), tone: 'neutral' },
    { title: t('finance.dashboard.moneyInBanks'), value: formatMoney(d.moneyInBanks), tone: 'neutral' },
  ]) : [];

  const integrationKpis = d ? (hasPeriod ? [
    {
      label: t('finance.dashboard.salesIncomePeriod'),
      value: formatMoney(d.salesIncomeMonth),
      hint: t('finance.dashboard.fromCashier'),
    },
    {
      label: t('finance.dashboard.purchaseExpensePeriod'),
      value: formatMoney(d.purchaseExpenseMonth),
      hint: t('finance.dashboard.fromStockReceipts'),
    },
  ] : [
    {
      label: t('finance.dashboard.salesIncomeToday'),
      value: formatMoney(d.salesIncomeToday),
      hint: t('finance.dashboard.salesCountToday', { count: d.salesCountToday ?? 0 }),
    },
    {
      label: t('finance.dashboard.salesIncomeMonth'),
      value: formatMoney(d.salesIncomeMonth),
      hint: t('finance.dashboard.fromCashier'),
    },
    {
      label: t('finance.dashboard.purchaseExpenseMonth'),
      value: formatMoney(d.purchaseExpenseMonth),
      hint: t('finance.dashboard.fromStockReceipts'),
    },
  ]) : [];

  return {
    t,
    filters,
    hasPeriod,
    query,
    kpis,
    integrationKpis,
    topExpenses: d?.topExpenseCategories ?? [],
    recentTransactions: d?.recentTransactions ?? [],
    last7Days: d?.last7Days ?? [],
    chartTitle: hasPeriod ? t('finance.dashboard.periodChart') : t('finance.dashboard.last7Days'),
  };
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfMonth, parseISO, isValid } from 'date-fns';
import { reportApi, productApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useDateFnsLocale } from '../../../hooks/useDateFnsLocale';
import { formatDashboardMoney } from '../constants';

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

function formatPeriodLabel(from, to, dateLocale, t) {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  if (!isValid(fromDate) || !isValid(toDate)) return '';
  if (from === to) {
    return format(fromDate, 'd MMMM yyyy', { locale: dateLocale });
  }
  return t('dashboard.periodRange', {
    from: format(fromDate, 'd MMM yyyy', { locale: dateLocale }),
    to: format(toDate, 'd MMM yyyy', { locale: dateLocale }),
  });
}

export function useDashboardPage() {
  const { t } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { tenantKey, tenantReady } = useTenantScope();
  const today = todayStr();

  const presets = useMemo(
    () => [
      { key: 'presetToday', from: () => today, to: () => today },
      { key: 'preset7', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => today },
      { key: 'presetMonth', from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => today },
    ],
    [today]
  );

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const periodLabel = formatPeriodLabel(from, to, dateLocale, t);
  const isSingleDay = from === to;
  const invalidRange = from > to;

  const { data: periodReport, isLoading: periodLoading } = useQuery({
    queryKey: tenantKey('dashboard-period', from, to),
    queryFn: () => reportApi.sales(from, to).then((r) => r.data),
    enabled: tenantReady && Boolean(from && to && from <= to),
  });

  const { data: lowStock } = useQuery({
    queryKey: tenantKey('dashboard-low-stock'),
    queryFn: () => productApi.getLowStock().then((r) => r.data),
    enabled: tenantReady,
  });

  const { data: topProducts } = useQuery({
    queryKey: tenantKey('dashboard-top-products', from, to),
    queryFn: () => reportApi.topProducts(5, from, to).then((r) => r.data),
    enabled: tenantReady && Boolean(from && to && from <= to),
  });

  const applyPreset = (preset) => {
    setFrom(preset.from());
    setTo(preset.to());
  };

  const isPresetActive = (preset) => from === preset.from() && to === preset.to();

  const loadingValue = periodLoading ? t('common.dots') : undefined;
  const fmt = formatDashboardMoney;

  const kpis = {
    revenue: loadingValue ?? fmt(periodReport?.totalRevenue),
    cost: loadingValue ?? fmt(periodReport?.totalCostEstimate),
    profit: loadingValue ?? fmt(periodReport?.grossProfit),
    itemsSold: loadingValue ?? (periodReport?.totalItemsSold ?? 0),
    avgCheck: loadingValue ?? fmt(periodReport?.averageTransactionValue),
    txCount: periodReport?.transactionCount ?? 0,
    profitPositive: (periodReport?.grossProfit ?? 0) >= 0,
    lowStockCount: lowStock?.length ?? 0,
  };

  return {
    t,
    from,
    to,
    setFrom,
    setTo,
    presets,
    applyPreset,
    isPresetActive,
    periodLabel,
    isSingleDay,
    invalidRange,
    periodReport,
    lowStock,
    topProducts,
    kpis,
  };
}

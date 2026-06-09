import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, TrendingUp } from 'lucide-react';
import { reportApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import {
  formatSalesCurrency,
  getDefaultSalesDateRange,
  getSalesDatePresets,
} from '../utils/salesDashboardUtils';

export function useReportsPage() {
  const { tenantKey, tenantReady } = useTenantScope();
  const presets = useMemo(() => getSalesDatePresets(), []);
  const defaults = useMemo(() => getDefaultSalesDateRange(), []);

  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);

  const rangeEnabled = tenantReady && !!from && !!to;

  const reportQuery = useQuery({
    queryKey: tenantKey('sales-report', from, to),
    queryFn: () => reportApi.sales(from, to).then((r) => r.data),
    enabled: rangeEnabled,
  });

  const topProductsQuery = useQuery({
    queryKey: tenantKey('top-products', from, to),
    queryFn: () => reportApi.topProducts(8, from, to).then((r) => r.data),
    enabled: rangeEnabled,
  });

  const cashierPerfQuery = useQuery({
    queryKey: tenantKey('cashier-perf', from, to),
    queryFn: () => reportApi.cashierPerf(from, to).then((r) => r.data),
    enabled: rangeEnabled,
  });

  const applyPreset = (preset) => {
    setFrom(preset.from());
    setTo(preset.to());
  };

  const report = reportQuery.data;
  const summaryCards = useMemo(
    () => [
      { icon: DollarSign, labelKey: 'totalRevenue', value: formatSalesCurrency(report?.totalRevenue), color: 'emerald' },
      {
        icon: TrendingUp,
        labelKey: 'transactions',
        value: report != null ? report.transactionCount : '—',
        color: 'blue',
      },
      {
        icon: Package,
        labelKey: 'itemsSold',
        value: report != null ? report.totalItemsSold : '—',
        color: 'amber',
      },
      { icon: DollarSign, labelKey: 'avgTxn', value: formatSalesCurrency(report?.averageTransactionValue), color: 'purple' },
    ],
    [report]
  );

  return {
    from,
    to,
    setFrom,
    setTo,
    presets,
    applyPreset,
    report,
    topProducts: topProductsQuery.data,
    cashierPerf: cashierPerfQuery.data,
    isLoading: reportQuery.isLoading,
    summaryCards,
    formatCurrency: formatSalesCurrency,
  };
}

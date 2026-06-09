import { Package, TrendingDown, TrendingUp, AlertTriangle, Warehouse } from 'lucide-react';

export function buildStockDashboardCards(t, data) {
  return [
    {
      icon: TrendingUp,
      label: t('stockReports.kpiReceived'),
      units: data?.receivedUnits,
      money: data?.receivedCostEstimate,
      color: 'emerald',
    },
    {
      icon: Package,
      label: t('stockReports.kpiSold'),
      units: data?.soldUnits,
      color: 'blue',
    },
    {
      icon: TrendingDown,
      label: t('stockReports.kpiWriteOff'),
      units: data?.writeOffUnits,
      money: data?.writeOffCostEstimate,
      color: 'red',
    },
    {
      icon: Warehouse,
      label: t('stockReports.kpiStock'),
      units: data?.currentStockUnits,
      money: data?.currentStockCostEstimate,
      color: 'amber',
    },
    {
      icon: AlertTriangle,
      label: t('stockReports.kpiLow'),
      units: data?.lowStockSkuCount,
      color: 'orange',
      link: '/reports/stock/low',
    },
  ];
}

export function buildStockDashboardChartData(dailyBreakdown) {
  return (dailyBreakdown ?? []).map((d) => ({
    date: d.date.slice(5),
    received: d.receivedUnits,
    sold: d.soldUnits,
    writeOff: d.writeOffUnits,
  }));
}

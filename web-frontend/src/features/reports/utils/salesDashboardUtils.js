import { format, subDays, startOfMonth } from 'date-fns';

export const SALES_DASHBOARD_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const SALES_CHART_GRID = '#e2e8f0';
export const SALES_CHART_TOOLTIP_BG = '#ffffff';
export const SALES_CHART_TOOLTIP_BORDER = '#e2e8f0';
export const SALES_CHART_LEGEND_LABEL = '#64748b';

export const formatSalesCurrency = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);

export function getSalesDatePresets() {
  return [
    { key: 'presetToday', from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset7', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset30', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'presetMonth', from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  ];
}

export function getDefaultSalesDateRange() {
  return {
    from: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  };
}

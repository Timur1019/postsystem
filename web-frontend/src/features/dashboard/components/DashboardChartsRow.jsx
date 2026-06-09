import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  DASHBOARD_CHART_ACCENT,
  DASHBOARD_CHART_GRID,
  DASHBOARD_CHART_TOOLTIP_BG,
  DASHBOARD_CHART_TOOLTIP_BORDER,
  DASHBOARD_CHART_TOOLTIP_LABEL,
  ellipsisLabel,
  formatDashboardMoney,
} from '../constants';

export default function DashboardChartsRow({ t, periodReport, topProducts }) {
  const fmt = formatDashboardMoney;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:col-span-2">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('dashboard.revenueChart')}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={periodReport?.dailyBreakdown ?? []}>
            <defs>
              <linearGradient id="dashboard-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_CHART_ACCENT} stopOpacity={0.3} />
                <stop offset="95%" stopColor={DASHBOARD_CHART_ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_CHART_GRID} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: DASHBOARD_CHART_TOOLTIP_BG,
                border: `1px solid ${DASHBOARD_CHART_TOOLTIP_BORDER}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: DASHBOARD_CHART_TOOLTIP_LABEL }}
              formatter={(v) => [fmt(v), t('dashboard.revenue')]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={DASHBOARD_CHART_ACCENT}
              fill="url(#dashboard-rev)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('dashboard.topProducts')}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={topProducts ?? []}
            layout="vertical"
            margin={{ top: 6, right: 10, bottom: 6, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_CHART_GRID} horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="productName"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              width={150}
              tickFormatter={(v) => ellipsisLabel(v, 22)}
            />
            <Tooltip
              contentStyle={{
                background: DASHBOARD_CHART_TOOLTIP_BG,
                border: `1px solid ${DASHBOARD_CHART_TOOLTIP_BORDER}`,
                borderRadius: 8,
              }}
              formatter={(v) => [v, t('dashboard.unitsSold')]}
            />
            <Bar dataKey="quantitySold" fill={DASHBOARD_CHART_ACCENT} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

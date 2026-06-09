import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  SALES_CHART_GRID,
  SALES_CHART_TOOLTIP_BG,
  SALES_CHART_TOOLTIP_BORDER,
} from '../../utils/salesDashboardUtils';

export default function ReportsDailyChart({ t, data, formatCurrency }) {
  if (!data?.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
      <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('reports.dailyBreakdown')}</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={SALES_CHART_GRID} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: SALES_CHART_TOOLTIP_BG,
              border: `1px solid ${SALES_CHART_TOOLTIP_BORDER}`,
              borderRadius: 8,
            }}
            formatter={(v) => [formatCurrency(v), t('dashboard.revenue')]}
          />
          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

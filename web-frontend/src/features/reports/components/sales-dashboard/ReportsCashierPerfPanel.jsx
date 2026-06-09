import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  SALES_CHART_LEGEND_LABEL,
  SALES_CHART_TOOLTIP_BG,
  SALES_CHART_TOOLTIP_BORDER,
  SALES_DASHBOARD_COLORS,
} from '../../utils/salesDashboardUtils';

export default function ReportsCashierPerfPanel({ t, cashierPerf, formatCurrency }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
      <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('reports.cashierPerf')}</h2>
      {cashierPerf?.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={cashierPerf}
                dataKey="revenue"
                nameKey="cashierName"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={false}
              >
                {cashierPerf.map((_, i) => (
                  <Cell key={i} fill={SALES_DASHBOARD_COLORS[i % SALES_DASHBOARD_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: SALES_CHART_TOOLTIP_BG,
                  border: `1px solid ${SALES_CHART_TOOLTIP_BORDER}`,
                  borderRadius: 8,
                }}
                formatter={(v) => [formatCurrency(v), t('dashboard.revenue')]}
              />
              <Legend
                formatter={(v) => (
                  <span style={{ color: SALES_CHART_LEGEND_LABEL, fontSize: 12 }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="reports-scroll-list mt-3 max-h-[min(12rem,28vh)] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {cashierPerf.map((cashier, i) => (
              <div key={cashier.cashierId ?? i} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: SALES_DASHBOARD_COLORS[i % SALES_DASHBOARD_COLORS.length] }}
                  />
                  <span className="text-slate-700 dark:text-slate-300">{cashier.cashierName}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(cashier.revenue)}
                  </span>
                  <span className="text-slate-500 text-xs ml-2">
                    {cashier.transactionCount} {t('common.txns')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-slate-500 text-sm">{t('reports.noCashierData')}</p>
      )}
    </div>
  );
}

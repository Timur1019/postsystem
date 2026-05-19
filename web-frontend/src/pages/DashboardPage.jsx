// src/pages/DashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { reportApi, productApi } from '../services/api';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { TrendingUp, ShoppingCart, AlertTriangle, DollarSign } from 'lucide-react';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
const CHART_GRID = '#e2e8f0';
const CHART_TOOLTIP_BG = '#ffffff';
const CHART_TOOLTIP_BORDER = '#e2e8f0';
const CHART_TOOLTIP_LABEL = '#64748b';

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue:    'bg-blue-500/10    text-blue-400',
    amber:   'bg-amber-500/10   text-amber-400',
    red:     'bg-red-500/10     text-red-400',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);

export default function DashboardPage() {
  const { t } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const today = format(new Date(), 'yyyy-MM-dd');
  const gridStroke = CHART_GRID;
  const tooltipBg = CHART_TOOLTIP_BG;
  const tooltipBorder = CHART_TOOLTIP_BORDER;
  const tooltipLabel = CHART_TOOLTIP_LABEL;

  const { data: daily } = useQuery({
    queryKey: ['daily-summary', today],
    queryFn: () => reportApi.daily(today).then(r => r.data),
  });

  const { data: weekReport } = useQuery({
    queryKey: ['week-report'],
    queryFn: () => {
      const from = format(new Date(Date.now() - 6 * 864e5), 'yyyy-MM-dd');
      return reportApi.sales(from, today).then(r => r.data);
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => productApi.getLowStock().then(r => r.data),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => reportApi.topProducts(5, null, null).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label={t('dashboard.todayRevenue')} value={fmt(daily?.totalRevenue)}
          sub={t('dashboard.todayTransactions', { count: daily?.transactionCount ?? 0 })} color="emerald" />
        <StatCard icon={ShoppingCart} label={t('dashboard.itemsSoldToday')} value={daily?.itemsSold ?? 0}
          sub={t('dashboard.unitsSubtitle')} color="blue" />
        <StatCard icon={TrendingUp} label={t('dashboard.weeklyRevenue')} value={fmt(weekReport?.totalRevenue)}
          sub={t('dashboard.last7days')} color="blue" />
        <StatCard icon={AlertTriangle} label={t('dashboard.lowStockAlerts')} value={lowStock?.length ?? 0}
          sub={t('dashboard.belowThreshold')} color={lowStock?.length > 0 ? 'red' : 'emerald'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly revenue area chart */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('dashboard.weeklyChart')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekReport?.dailyBreakdown ?? []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: tooltipLabel }}
                formatter={(v) => [fmt(v), t('dashboard.revenue')]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products bar chart */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('dashboard.topProducts')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis type="category" dataKey="productName" tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                formatter={(v) => [v, t('dashboard.unitsSold')]}
              />
              <Bar dataKey="quantitySold" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock table */}
      {lowStock?.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/40 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />
            {t('dashboard.lowStockTitle')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-200 text-left text-slate-600 dark:border-slate-800 dark:text-slate-500">
                  <th className="pb-2 font-medium">{t('dashboard.colProduct')}</th>
                  <th className="pb-2 font-medium">{t('dashboard.colSku')}</th>
                  <th className="pb-2 font-medium text-right">{t('dashboard.colInStock')}</th>
                  <th className="pb-2 font-medium text-right">{t('dashboard.colMinAlert')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-slate-800">
                {lowStock.map((p) => (
                  <tr key={p.id} className="text-slate-800 dark:text-slate-300">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-500">{p.sku}</td>
                    <td className="py-2 text-right font-semibold text-red-600 dark:text-red-400">{p.stockQuantity}</td>
                    <td className="py-2 text-right text-slate-600 dark:text-slate-500">{p.lowStockAlert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

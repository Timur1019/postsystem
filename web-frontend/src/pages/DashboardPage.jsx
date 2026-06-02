// src/pages/DashboardPage.jsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { reportApi, productApi } from '../services/api';
import { useTenantScope } from '../hooks/useTenantScope';
import { format, subDays, startOfMonth, parseISO, isValid } from 'date-fns';
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
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  Coins,
  Wallet,
  Calendar,
  Receipt,
} from 'lucide-react';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';

const CHART_GRID = '#e2e8f0';
const CHART_TOOLTIP_BG = '#ffffff';
const CHART_TOOLTIP_BORDER = '#e2e8f0';
const CHART_TOOLTIP_LABEL = '#64748b';

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{sub}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);

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

export default function DashboardPage() {
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

  const loadingValue = periodLoading ? t('common.dots') : undefined;
  const revenue = loadingValue ?? fmt(periodReport?.totalRevenue);
  const cost = loadingValue ?? fmt(periodReport?.totalCostEstimate);
  const profit = loadingValue ?? fmt(periodReport?.grossProfit);
  const itemsSold = loadingValue ?? (periodReport?.totalItemsSold ?? 0);
  const avgCheck = loadingValue ?? fmt(periodReport?.averageTransactionValue);
  const txCount = periodReport?.transactionCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{periodLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
            <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
            />
            <span className="text-slate-400 dark:text-slate-500">—</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const active = from === p.from() && to === p.to();
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {t(`reports.${p.key}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {from > to ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          {t('dashboard.invalidRange')}
        </p>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={DollarSign}
          label={isSingleDay ? t('dashboard.todayRevenue') : t('dashboard.periodRevenue')}
          value={revenue}
          sub={t('dashboard.periodTransactions', { count: txCount })}
          color="emerald"
        />
        <StatCard
          icon={Coins}
          label={isSingleDay ? t('dashboard.todayCost') : t('dashboard.periodCost')}
          value={cost}
          sub={t('dashboard.costSubtitle')}
          color="amber"
        />
        <StatCard
          icon={Wallet}
          label={isSingleDay ? t('dashboard.todayGrossProfit') : t('dashboard.periodGrossProfit')}
          value={profit}
          sub={t('dashboard.grossProfitSubtitle')}
          color={(periodReport?.grossProfit ?? 0) >= 0 ? 'emerald' : 'red'}
        />
        <StatCard
          icon={ShoppingCart}
          label={isSingleDay ? t('dashboard.itemsSoldToday') : t('dashboard.periodItemsSold')}
          value={itemsSold}
          sub={t('dashboard.unitsSubtitle')}
          color="blue"
        />
        <StatCard
          icon={Receipt}
          label={t('dashboard.avgCheck')}
          value={avgCheck}
          sub={t('dashboard.avgCheckSubtitle')}
          color="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('dashboard.lowStockAlerts')}
          value={lowStock?.length ?? 0}
          sub={t('dashboard.belowThreshold')}
          color={lowStock?.length > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('dashboard.revenueChart')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={periodReport?.dailyBreakdown ?? []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: CHART_TOOLTIP_BG,
                  border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: CHART_TOOLTIP_LABEL }}
                formatter={(v) => [fmt(v), t('dashboard.revenue')]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('dashboard.topProducts')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="productName"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: CHART_TOOLTIP_BG,
                  border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                  borderRadius: 8,
                }}
                formatter={(v) => [v, t('dashboard.unitsSold')]}
              />
              <Bar dataKey="quantitySold" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {lowStock?.length > 0 ? (
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
                  <th className="pb-2 text-right font-medium">{t('dashboard.colInStock')}</th>
                  <th className="pb-2 text-right font-medium">{t('dashboard.colMinAlert')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-slate-800">
                {lowStock.map((p) => (
                  <tr key={p.id} className="text-slate-800 dark:text-slate-300">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-500">{p.sku}</td>
                    <td className="py-2 text-right font-semibold text-red-600 dark:text-red-400">
                      {p.stockQuantity}
                    </td>
                    <td className="py-2 text-right text-slate-600 dark:text-slate-500">{p.lowStockAlert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

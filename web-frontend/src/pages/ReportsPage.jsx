// src/pages/ReportsPage.jsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { reportApi } from '../services/api';
import { format, subDays, startOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, Package } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.mode === 'dark');
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const presets = useMemo(() => [
    { key: 'presetToday', from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset7', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset30', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'presetMonth', from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  ], []);

  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: report, isLoading } = useQuery({
    queryKey: ['sales-report', from, to],
    queryFn: () => reportApi.sales(from, to).then(r => r.data),
    enabled: !!from && !!to,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products', from, to],
    queryFn: () => reportApi.topProducts(8, from, to).then(r => r.data),
  });

  const { data: cashierPerf } = useQuery({
    queryKey: ['cashier-perf', from, to],
    queryFn: () => reportApi.cashierPerf(from, to).then(r => r.data),
  });

  const applyPreset = (preset) => {
    setFrom(preset.from());
    setTo(preset.to());
  };

  const summaryCards = [
    { icon: DollarSign, labelKey: 'totalRevenue', value: fmt(report?.totalRevenue), color: 'emerald' },
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
    { icon: DollarSign, labelKey: 'avgTxn', value: fmt(report?.averageTransactionValue), color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('reports.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('reports.subtitle')}</p>
      </div>

      {/* Date controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
          <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
          />
          <span className="text-slate-400 dark:text-slate-500">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg bg-slate-200 px-3 py-2 text-xs text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t(`reports.${p.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ icon: Icon, labelKey, value }) => (
          <div key={labelKey} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">{t(`reports.${labelKey}`)}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{isLoading ? t('common.dots') : value}</p>
          </div>
        ))}
      </div>

      {/* Daily breakdown chart */}
      {report?.dailyBreakdown?.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('reports.dailyBreakdown')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                formatter={(v) => [fmt(v), t('dashboard.revenue')]}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('reports.topByUnits')}</h2>
          {topProducts?.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-slate-500 dark:text-slate-500">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate text-slate-900 dark:text-white">{p.productName}</span>
                      <span className="ml-2 flex-shrink-0 text-slate-600 dark:text-slate-400">
                        {p.quantitySold} {t('reports.unitsSuffix')}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(p.quantitySold / topProducts[0].quantitySold) * 100}%` }} />
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {fmt(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">{t('common.noData')}</p>
          )}
        </div>

        {/* Cashier performance */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('reports.cashierPerf')}</h2>
          {cashierPerf?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={cashierPerf} dataKey="revenue" nameKey="cashierName"
                    cx="50%" cy="50%" outerRadius={80} label={false}>
                    {cashierPerf.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                    formatter={(v) => [fmt(v), t('dashboard.revenue')]}
                  />
                  <Legend
                    formatter={(v) => (
                      <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {cashierPerf.map((c, i) => (
                  <div key={c.cashierId ?? i} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-700 dark:text-slate-300">{c.cashierName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-slate-900 dark:text-white">{fmt(c.revenue)}</span>
                      <span className="text-slate-500 text-xs ml-2">
                        {c.transactionCount} {t('common.txns')}
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
      </div>
    </div>
  );
}

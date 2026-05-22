import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Package, TrendingDown, TrendingUp, AlertTriangle, Warehouse } from 'lucide-react';
import { stockReportApi, storeApi } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import ReportDateBar from '../../components/reports/ReportDateBar';
import { fmtMoney } from '../../utils/formatMoney';

export default function StockDashboardPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [storeId, setStoreId] = useState('');

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['stock-dashboard', from, to, storeId],
    queryFn: () =>
      stockReportApi.dashboard({
        from,
        to,
        storeId: storeId === '' ? undefined : Number(storeId),
      }).then((r) => r.data),
    enabled: !!from && !!to,
  });

  const formatUnits = (units) => {
    if (isLoading) return '…';
    if (isError) return '—';
    return units ?? 0;
  };

  const cards = [
    { icon: TrendingUp, label: t('stockReports.kpiReceived'), units: data?.receivedUnits, money: data?.receivedCostEstimate, color: 'emerald' },
    { icon: Package, label: t('stockReports.kpiSold'), units: data?.soldUnits, color: 'blue' },
    { icon: TrendingDown, label: t('stockReports.kpiWriteOff'), units: data?.writeOffUnits, money: data?.writeOffCostEstimate, color: 'red' },
    { icon: Warehouse, label: t('stockReports.kpiStock'), units: data?.currentStockUnits, money: data?.currentStockCostEstimate, color: 'amber' },
    { icon: AlertTriangle, label: t('stockReports.kpiLow'), units: data?.lowStockSkuCount, color: 'orange', link: '/reports/stock/low' },
  ];

  const chartData = (data?.dailyBreakdown ?? []).map((d) => ({
    date: d.date.slice(5),
    received: d.receivedUnits,
    sold: d.soldUnits,
    writeOff: d.writeOffUnits,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.dashboardTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.dashboardSubtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">{t('stockReports.allStores')}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ icon: Icon, label, units, money, color, link }) => {
          const inner = (
            <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${link ? 'hover:border-emerald-500/50 transition' : ''}`}>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon size={16} className={`text-${color}-600`} />
                <p className="text-xs">{label}</p>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {`${formatUnits(units)} ${t('stockReports.unitsSuffix')}`}
              </p>
              {money != null && !isLoading && !isError && (
                <p className="text-xs text-slate-500">{fmtMoney(money)}</p>
              )}
            </div>
          );
          return link ? <Link key={label} to={link}>{inner}</Link> : <div key={label}>{inner}</div>;
        })}
      </div>

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {getApiErrorMessage(error, t('stockReports.loadError'))}
        </p>
      )}

      {chartData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('stockReports.chartTitle')}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="received" name={t('stockReports.legendReceived')} fill="#10b981" />
              <Bar dataKey="sold" name={t('stockReports.legendSold')} fill="#3b82f6" />
              <Bar dataKey="writeOff" name={t('stockReports.legendWriteOff')} fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/reports/sales/by-products" className="text-emerald-700 hover:underline dark:text-emerald-400">
          {t('stockReports.linkSalesByProducts')}
        </Link>
        <Link to="/reports/stock/write-offs" className="text-emerald-700 hover:underline dark:text-emerald-400">
          {t('stockReports.linkWriteOffs')}
        </Link>
        <Link to="/reports/stock/turnover" className="text-emerald-700 hover:underline dark:text-emerald-400">
          {t('stockReports.linkTurnover')}
        </Link>
        <Link to="/reports/stock/lifecycle" className="text-emerald-700 hover:underline dark:text-emerald-400">
          {t('stockReports.linkLifecycle')}
        </Link>
        <Link to="/reports/stock/movements" className="text-emerald-700 hover:underline dark:text-emerald-400">
          {t('stockReports.linkMovements')}
        </Link>
        <Link to="/reports/stock/receipts" className="text-emerald-700 hover:underline dark:text-emerald-400">
          {t('stockReports.linkReceipts')}
        </Link>
      </div>
    </div>
  );
}

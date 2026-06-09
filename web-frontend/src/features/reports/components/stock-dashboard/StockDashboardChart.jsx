import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function StockDashboardChart({ t, chartData }) {
  if (!chartData.length) return null;

  return (
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
  );
}

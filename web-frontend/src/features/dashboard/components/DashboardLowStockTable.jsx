import { AlertTriangle } from 'lucide-react';

export default function DashboardLowStockTable({ t, lowStock }) {
  if (!lowStock?.length) return null;

  return (
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
  );
}

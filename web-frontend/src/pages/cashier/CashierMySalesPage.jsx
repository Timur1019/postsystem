// src/pages/cashier/CashierMySalesPage.jsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { saleApi } from '../../services/api';
import { format } from 'date-fns';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

export default function CashierMySalesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isPending } = useQuery({
    queryKey: ['my-sales'],
    queryFn: () => saleApi.mySales({ page: 0, size: 50 }).then((r) => r.data),
  });

  const rows = data?.content ?? [];

  return (
    <div className="cashier-page space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('pos.mySalesTitle')}</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
              <th className="px-4 py-3">{t('pos.receipt')}</th>
              <th className="px-4 py-3">{t('pos.date')}</th>
              <th className="px-4 py-3">{t('pos.total')}</th>
              <th className="px-4 py-3">{t('pos.payment')}</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {isPending ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">{t('pos.noSales')}</td></tr>
            ) : rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => navigate(`/receipt/${row.receiptNumber}`)}
              >
                <td className="px-4 py-3 font-mono text-xs">{row.receiptNumber}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {row.createdAt ? format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                </td>
                <td className="px-4 py-3 font-semibold">{fmt(row.totalAmount)}</td>
                <td className="px-4 py-3">{row.paymentMethod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

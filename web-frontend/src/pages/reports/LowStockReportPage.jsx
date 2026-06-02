import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { stockReportApi } from '../../services/api';
import { useTenantScope } from '../../hooks/useTenantScope';
import TablePagination from '../../components/shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';

export default function LowStockReportPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isPending, isError, error } = useQuery({
    queryKey: tenantKey('reports-low-stock', page, pageSize),
    queryFn: () => stockReportApi.lowStock({ page, size: pageSize }).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: tenantReady,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.lowStockTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.lowStockSubtitle')}</p>
        <Link to="/reports/stock" className="mt-2 inline-block text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← {t('stockReports.backDashboard')}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colStock')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colMin')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colDeficit')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colStockValue')}</th>
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</td></tr>
              )}
              {isError && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-red-600">{error?.response?.data?.message ?? t('common.error')}</td></tr>
              )}
              {!isPending && !isError && rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('stockReports.lowStockEmpty')}</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.productId} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{r.productName}</div>
                    <div className="text-xs text-slate-500">{r.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-amber-700 dark:text-amber-400">{r.stockQuantity}</td>
                  <td className="px-4 py-3 text-right">{r.lowStockAlert}</td>
                  <td className="px-4 py-3 text-right text-red-600">−{r.deficit}</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(r.stockValueEstimate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={data?.totalElements ?? 0}
          totalPages={data?.totalPages ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}

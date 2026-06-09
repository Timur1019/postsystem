import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import { useLowStockReportPage } from '../hooks/useLowStockReportPage';

export default function LowStockReportPage() {
  const { t } = useTranslation();
  const r = useLowStockReportPage();

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
              {r.isPending && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</td></tr>
              )}
              {r.isError && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-red-600">{r.error?.response?.data?.message ?? t('common.error')}</td></tr>
              )}
              {!r.isPending && !r.isError && r.rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('common.noData')}</td></tr>
              )}
              {r.rows.map((row) => (
                <tr key={row.productId} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{row.productName}</div>
                    <div className="text-xs text-slate-500">{row.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{row.currentStock}</td>
                  <td className="px-4 py-3 text-right">{row.minStock}</td>
                  <td className="px-4 py-3 text-right text-red-600">{row.deficit}</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(row.stockValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination page={r.page} pageSize={r.pageSize} total={r.total} totalPages={r.totalPages} onPageChange={r.setPage} onPageSizeChange={r.setPageSize} />
      </div>
    </div>
  );
}

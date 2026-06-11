import { useTranslation } from 'react-i18next';
import { stockReportApi } from '../../../api';
import { BaseSelect } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportExportButton from '../components/ReportExportButton';
import { useStockBalancesReportPage } from '../hooks/useStockBalancesReportPage';

export default function StockBalancesReportPage() {
  const { t } = useTranslation();
  const r = useStockBalancesReportPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.balancesTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.balancesSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => stockReportApi.exportBalances(r.exportParams)}
          filenamePrefix="stock_balances"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          value={r.search}
          onChange={(e) => r.handleSearchChange(e.target.value)}
          placeholder={t('common.search')}
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <BaseSelect
          value={r.categoryId}
          onChange={(e) => r.handleCategoryChange(e.target.value)}
          placeholder={t('stockReports.allCategories')}
          options={[
            { value: '', label: t('stockReports.allCategories') },
            ...r.categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={r.onlyWithStock} onChange={(e) => r.handleOnlyWithStockChange(e.target.checked)} />
          {t('stockReports.onlyWithStock')}
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3">{t('stockReports.colCategory')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStock')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colMin')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStockValue')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.productId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{row.productName}</td>
                <td className="px-4 py-3">{row.categoryName || '—'}</td>
                <td className="px-4 py-3 text-right">{row.stockQuantity}</td>
                <td className="px-4 py-3 text-right">{row.lowStockAlert}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.stockValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={r.page} pageSize={r.pageSize} total={r.total} totalPages={r.totalPages} onPageChange={r.setPage} onPageSizeChange={r.setPageSize} />
    </div>
  );
}

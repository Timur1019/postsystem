import { useTranslation } from 'react-i18next';
import { stockReportApi } from '../../../api';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportExportButton from '../components/ReportExportButton';
import { useDeadStockReportPage } from '../hooks/useDeadStockReportPage';

export default function DeadStockReportPage() {
  const { t } = useTranslation();
  const r = useDeadStockReportPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.deadStockTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.deadStockSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => stockReportApi.exportDeadStock(r.exportParams)}
          filenamePrefix="dead_stock"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          {t('stockReports.daysNoSale')}
          <input
            type="number"
            min={1}
            value={r.daysNoSale}
            onChange={(e) => r.handleDaysChange(e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <input
          value={r.search}
          onChange={(e) => r.handleSearchChange(e.target.value)}
          placeholder={t('common.search')}
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={r.categoryId}
          onChange={(e) => r.handleCategoryChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">{t('stockReports.allCategories')}</option>
          {r.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3">{t('stockReports.colCategory')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStock')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStockValue')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colLastSale')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colDaysIdle')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={6} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.productId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.productName}</div>
                  <div className="text-xs text-slate-500">{row.sku}</div>
                </td>
                <td className="px-4 py-3">{row.categoryName || '—'}</td>
                <td className="px-4 py-3 text-right">{row.stockQuantity}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.stockValue)}</td>
                <td className="px-4 py-3 text-right">{row.lastSaleDate ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-amber-700">{row.daysWithoutSale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={r.page} pageSize={r.pageSize} total={r.total} totalPages={r.totalPages} onPageChange={r.setPage} onPageSizeChange={r.setPageSize} />
    </div>
  );
}

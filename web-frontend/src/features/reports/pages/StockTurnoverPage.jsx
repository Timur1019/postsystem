import { useTranslation } from 'react-i18next';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import { useStockTurnoverPage } from '../hooks/useStockTurnoverPage';

export default function StockTurnoverPage() {
  const { t } = useTranslation();
  const r = useStockTurnoverPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.turnoverTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.turnoverSubtitle')}</p>
      </div>
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
      <div className="flex flex-wrap gap-3">
        <input
          value={r.search}
          onChange={(e) => r.handleSearchChange(e.target.value)}
          placeholder={t('common.search')}
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={r.categoryId}
          onChange={(e) => r.handleCategoryChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">{t('stockReports.allCategories')}</option>
          {r.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-left uppercase text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">{t('stockReports.colProduct')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colOpening')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colReceived')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colSold')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colWriteOffShort')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colClosing')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colStockValue')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={7} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.productId} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">
                  <div className="font-medium">{row.productName}</div>
                  <div className="text-slate-500">{row.sku}</div>
                </td>
                <td className="px-2 py-2 text-right">{row.openingQuantity}</td>
                <td className="px-2 py-2 text-right text-emerald-700">+{row.receivedQuantity}</td>
                <td className="px-2 py-2 text-right text-blue-700">−{row.soldQuantity}</td>
                <td className="px-2 py-2 text-right text-red-700">−{row.writeOffQuantity}</td>
                <td className="px-2 py-2 text-right font-semibold">{row.closingQuantity}</td>
                <td className="px-2 py-2 text-right">{fmtMoney(row.closingCostEstimate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={r.page}
          pageSize={r.pageSize}
          total={r.total}
          totalPages={r.totalPages}
          onPageChange={r.setPage}
          onPageSizeChange={r.setPageSize}
        />
      </div>
    </div>
  );
}

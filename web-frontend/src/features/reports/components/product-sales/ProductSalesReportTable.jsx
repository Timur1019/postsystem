import TablePagination from '../../../../components/shared/TablePagination';
import { fmtMoney } from '../../../../utils/formatMoney';

export default function ProductSalesReportTable({
  t,
  rows,
  isPending,
  isError,
  error,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3">{t('stockReports.colCategory')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colSold')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colReturned')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colNet')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colRevenue')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colMargin')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-red-600">
                  {error?.response?.data?.message ?? t('common.error')}
                </td>
              </tr>
            )}
            {!isPending && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('common.noData')}</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.productId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 dark:text-white">{row.productName}</div>
                  <div className="text-xs text-slate-500">
                    {row.sku}
                    {row.barcode ? ` · ${row.barcode}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.categoryName || '—'}</td>
                <td className="px-4 py-3 text-right">{row.quantitySold}</td>
                <td className="px-4 py-3 text-right">{row.quantityReturned}</td>
                <td className="px-4 py-3 text-right font-medium">{row.netQuantity}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.revenue)}</td>
                <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{fmtMoney(row.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

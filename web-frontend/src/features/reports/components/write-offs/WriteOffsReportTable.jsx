import { format as fmtDate } from 'date-fns';
import TablePagination from '../../../../components/shared/TablePagination';
import { fmtMoney } from '../../../../utils/formatMoney';

export default function WriteOffsReportTable({
  t,
  rows,
  isPending,
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
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
              <th className="px-4 py-3">{t('stockReports.writeOffReason')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colLoss')}</th>
              <th className="px-4 py-3">{t('stockReports.colUser')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!isPending && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 whitespace-nowrap">
                  {row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{row.productName}</div>
                  <div className="text-xs text-slate-500">{row.sku}</div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-400">
                  −{row.quantity}
                </td>
                <td className="px-4 py-3">
                  {t(`stockReports.reasons.${row.reason}`, { defaultValue: row.reason })}
                </td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.lossAmount)}</td>
                <td className="px-4 py-3 text-slate-600">{row.createdByName ?? '—'}</td>
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

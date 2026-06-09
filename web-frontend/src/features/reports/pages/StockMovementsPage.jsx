import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import TablePagination from '../../../components/shared/TablePagination';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { useStockMovementsPage } from '../hooks/useStockMovementsPage';

export default function StockMovementsPage() {
  const { t } = useTranslation();
  const r = useStockMovementsPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.movementsTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.movementsSubtitle')}</p>
      </div>
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
      <div className="flex flex-wrap gap-3">
        <input
          value={r.search}
          onChange={(e) => r.handleSearchChange(e.target.value)}
          placeholder={t('common.search')}
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={r.movementType}
          onChange={(e) => r.handleMovementTypeChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {r.movementTypes.map((tp) => (
            <option key={tp} value={tp}>{t(`stockReports.movementTypes.${tp}`, { defaultValue: tp })}</option>
          ))}
        </select>
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colType')}</th>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
              <th className="px-4 py-3">{t('stockReports.colDoc')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={5} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="whitespace-nowrap px-4 py-2">
                  {row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yy HH:mm') : '—'}
                </td>
                <td className="px-4 py-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {t(`stockReports.movementTypes.${row.movementType}`, { defaultValue: row.movementType })}
                  </span>
                </td>
                <td className="px-4 py-2">{row.productName}</td>
                <td className={`px-4 py-2 text-right font-medium ${row.quantity >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {row.receiptNumber || row.notes || '—'}
                </td>
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

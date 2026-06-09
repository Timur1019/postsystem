import { format } from 'date-fns';
import TablePagination from '../../../../../components/shared/TablePagination';
import { fmtMoney } from '../../../../../utils/formatMoney';
import { lifecycleQtyClass } from '../../../utils/productLifecycleUi';

export default function ProductLifecycleEventsTable({
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
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">{t('products.lifecycle.colDate')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colType')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colDelta')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colStockAfter')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colUnitCost')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colCostDelta')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colStore')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colReference')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colUser')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colNotes')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!isPending && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                  {t('products.lifecycle.empty')}
                </td>
              </tr>
            )}
            {rows.map((ev) => (
              <tr key={ev.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {ev.occurredAt ? format(new Date(ev.occurredAt), 'dd.MM.yyyy HH:mm') : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {t(`stockReports.movementTypes.${ev.eventType}`, { defaultValue: ev.eventType })}
                  </span>
                  {ev.writeOffReason && (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {t(`stockReports.writeOffReasons.${ev.writeOffReason}`, {
                        defaultValue: ev.writeOffReason,
                      })}
                    </span>
                  )}
                </td>
                <td className={`px-3 py-2 text-right font-semibold ${lifecycleQtyClass(ev.quantityDelta)}`}>
                  {ev.quantityDelta > 0 ? `+${ev.quantityDelta}` : ev.quantityDelta}
                </td>
                <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">
                  {ev.stockAfter != null ? ev.stockAfter : '—'}
                </td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">
                  {ev.unitCostEstimate != null ? fmtMoney(ev.unitCostEstimate) : '—'}
                </td>
                <td className={`px-3 py-2 text-right ${lifecycleQtyClass(ev.costDeltaEstimate)}`}>
                  {ev.costDeltaEstimate != null ? fmtMoney(ev.costDeltaEstimate) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ev.storeName || '—'}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  {ev.referenceLabel ? (
                    <span>
                      {ev.referenceType && (
                        <span className="text-xs text-slate-500">
                          {t(`products.lifecycle.refTypes.${ev.referenceType}`, {
                            defaultValue: ev.referenceType,
                          })}
                          :{' '}
                        </span>
                      )}
                      <span className="font-mono text-xs">{ev.referenceLabel}</span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ev.performedBy || '—'}</td>
                <td className="px-3 py-2 max-w-[12rem] truncate text-slate-500" title={ev.notes || ''}>
                  {ev.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </>
  );
}

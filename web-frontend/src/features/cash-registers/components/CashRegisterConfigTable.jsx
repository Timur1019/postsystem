import { Lock, Trash2 } from 'lucide-react';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtConfigCount } from '../utils/cashRegisterDisplayUtils';

const COL_COUNT = 5;

export default function CashRegisterConfigTable({
  t,
  rows,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">{t('cashRegisters.configColName')}</th>
              <th className="px-4 py-3">{t('cashRegisters.configColStores')}</th>
              <th className="px-4 py-3">{t('cashRegisters.configColRegisters')}</th>
              <th className="px-4 py-3">{t('cashRegisters.configColCategories')}</th>
              <th className="w-16 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-slate-500">
                  {t('cashRegisters.configEmpty')}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <span className="inline-flex items-center gap-2">
                      {r.lockedDefault && <Lock size={14} className="shrink-0 text-slate-500" aria-hidden />}
                      {r.name}
                    </span>
                    {r.lockedDefault && (
                      <div className="mt-0.5 text-xs font-normal text-slate-500">{t('cashRegisters.configDefaultLocked')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200">{fmtConfigCount(r.storeCount)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200">{fmtConfigCount(r.registerCount)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200">{fmtConfigCount(r.categoryCount)}</td>
                  <td className="px-2 py-3 text-right">
                    {!r.lockedDefault && (
                      <button
                        type="button"
                        onClick={() => onDelete(r)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                        title={t('cashRegisters.configDelete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
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

import { Info } from 'lucide-react';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../../components/shared/TablePagination';
import { fmtMoney } from '../../../../utils/formatMoney';

const COL_COUNT = 7;

export default function ReturnsTable({
  t,
  rows,
  loading,
  showEmptyHint,
  fmtAt,
  menuOpenId,
  onMenuOpenChange,
  onOpenDetail,
  onEditReason,
  onContinueReturn,
  onCancelReturn,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">{t('returnsModule.colDate')}</th>
              <th className="px-4 py-3">{t('returnsModule.colFiscal')}</th>
              <th className="px-4 py-3 text-right">{t('returnsModule.colAmount')}</th>
              <th className="px-4 py-3 text-right">{t('returnsModule.colPositions')}</th>
              <th className="px-4 py-3">{t('returnsModule.colStore')}</th>
              <th className="px-4 py-3">{t('returnsModule.colReason')}</th>
              <th className="px-4 py-3 text-right">{t('returnsModule.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : showEmptyHint ? (
              <tr>
                <td colSpan={COL_COUNT} className="p-0">
                  <div className="m-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                    <Info className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" size={20} />
                    <p>{t('returnsModule.emptyHint')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{fmtAt(row.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {row.fiscalModuleId}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{row.positionsCount}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{row.storeName ?? '—'}</td>
                  <td
                    className="max-w-[200px] truncate px-4 py-3 text-slate-700 dark:text-slate-300"
                    title={row.reason || ''}
                  >
                    {row.reason?.trim() ? row.reason : '—'}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <TableRowActionsMenu
                      open={menuOpenId === row.id}
                      onOpenChange={(open) => onMenuOpenChange(open ? row.id : null)}
                      actions={[
                        {
                          label: t('returnsModule.viewInfo'),
                          onClick: () => onOpenDetail(row),
                        },
                        {
                          label: t('returnsModule.editReason'),
                          onClick: () => onEditReason(row),
                        },
                        ...(row.status === 'REFUNDED'
                          ? [
                              {
                                label: t('returnsModule.returnMore'),
                                onClick: () => onContinueReturn(row),
                              },
                            ]
                          : []),
                        ...(row.status === 'VOIDED'
                          ? [
                              {
                                label: t('returnsModule.cancelReturn'),
                                danger: true,
                                onClick: () => onCancelReturn(row),
                              },
                            ]
                          : []),
                      ]}
                    />
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

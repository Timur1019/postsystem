import { CheckCircle2, Circle } from 'lucide-react';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../../components/shared/TablePagination';

export default function StoresTable({
  t,
  isPending,
  rows,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
            <th className="px-4 py-3 font-medium">{t('stores.colName')}</th>
            <th className="px-4 py-3 font-medium">{t('stores.colBusinessType')}</th>
            <th className="px-4 py-3 font-medium">{t('stores.colAddress')}</th>
            <th className="px-4 py-3 font-medium">{t('stores.colPhone')}</th>
            <th className="px-4 py-3 font-medium">{t('stores.colActive')}</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {isPending ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                {t('common.loading')}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                {t('stores.empty')}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`)}
                </td>
                <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-400">{row.address || '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.phone || '—'}</td>
                <td className="px-4 py-3">
                  {row.active ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <Circle size={18} className="text-slate-400" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <TableRowActionsMenu
                    open={menuId === row.id}
                    onOpenChange={(next) => onMenuOpenChange(next ? row.id : null)}
                    actions={[
                      { label: t('common.edit'), onClick: () => onEdit(row) },
                      {
                        label: row.active ? t('stores.deactivate') : t('stores.activate'),
                        onClick: () => onToggleActive(row.id),
                      },
                      {
                        label: t('common.delete'),
                        danger: true,
                        onClick: () => onDelete(row),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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

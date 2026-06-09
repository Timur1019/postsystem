import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import { BaseTable } from '../../../components/ui';

export default function PlatformCompaniesTable({
  t,
  isPending,
  rows,
  menuId,
  onMenuOpenChange,
  onEdit,
  onDelete,
}) {
  return (
    <BaseTable
      isLoading={isPending}
      isEmpty={!isPending && rows.length === 0}
      loadingMessage={t('common.loading')}
      emptyMessage={t('common.noData')}
      colSpan={6}
    >
      {!isPending && rows.length > 0 && (
        <>
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
              <th className="px-4 py-3">{t('platform.colName')}</th>
              <th className="px-4 py-3">{t('platform.colLoginCode')}</th>
              <th className="px-4 py-3">{t('platform.colStores')}</th>
              <th className="px-4 py-3">{t('platform.colBusinessType')}</th>
              <th className="px-4 py-3">{t('common.status')}</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 font-mono text-xs tracking-wide text-slate-600 dark:text-slate-400">
                  {row.loginCode || '—'}
                </td>
                <td className="px-4 py-3">{row.storeCount}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`)}
                </td>
                <td className="px-4 py-3">
                  {row.active ? t('common.active') : t('common.inactive')}
                </td>
                <td className="px-4 py-3">
                  <TableRowActionsMenu
                    open={menuId === row.id}
                    onOpenChange={(next) => onMenuOpenChange(next ? row.id : null)}
                    actions={[
                      { label: t('common.edit'), onClick: () => onEdit(row) },
                      {
                        label: t('common.delete'),
                        danger: true,
                        onClick: () => onDelete(row),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </>
      )}
    </BaseTable>
  );
}

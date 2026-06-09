import { Tags, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TablePagination from '../../../../components/shared/TablePagination';
import { BaseTable } from '../../../../components/ui';

export default function CategoriesTable({
  manage,
  isLoading,
  pageRows,
  categories,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onToggleRowMenu,
}) {
  const { t } = useTranslation();
  const colSpan = manage ? 4 : 3;

  return (
    <BaseTable
      isLoading={isLoading}
      isEmpty={!isLoading && categories.length === 0}
      loadingMessage={t('common.loading')}
      emptyMessage={(
        <span className="inline-flex flex-col items-center">
          <Tags className="mb-2 opacity-40" size={32} />
          {t('categories.none')}
        </span>
      )}
      colSpan={colSpan}
      footer={
        !isLoading && categories.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : null
      }
    >
      {!isLoading && categories.length > 0 && (
        <>
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-800 dark:text-slate-500">
              <th className="px-4 py-3 font-medium w-24">{t('categories.colId')}</th>
              <th className="px-4 py-3 font-medium">{t('categories.colName')}</th>
              <th className="px-4 py-3 font-medium">{t('categories.colDescription')}</th>
              {manage && (
                <th className="px-4 py-3 font-medium w-12 text-right" aria-label={t('categories.actions')} />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pageRows.map((c) => (
              <tr key={c.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.id}</td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.description ?? '—'}</td>
                {manage && (
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRowMenu(c, e.currentTarget.getBoundingClientRect());
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </>
      )}
    </BaseTable>
  );
}

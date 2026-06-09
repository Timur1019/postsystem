import { Info } from 'lucide-react';
import TablePagination from '../../../../components/shared/TablePagination';

export default function SuppliersTable({
  t,
  loading,
  rows,
  fmtDate,
  showEmptyHint,
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
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <th className="px-4 py-3">{t('suppliersModule.colDate')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colName')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colTax')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colAddress')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colEmail')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colPhone')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/80">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(row.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{row.taxId}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.address ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.phone ?? '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {showEmptyHint && (
        <div className="flex items-start gap-3 border-t border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100">
          <Info size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>{t('suppliersModule.empty')}</span>
        </div>
      )}

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

export default function ReportDataTable({
  rows,
  isPending,
  isError,
  error,
  t,
  columns,
  renderRow,
  emptyColSpan,
}) {
  const colSpan = emptyColSpan ?? columns.length;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isPending && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center">
                {t('common.loading')}
              </td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-red-600">
                {error?.response?.data?.message ?? t('common.error')}
              </td>
            </tr>
          )}
          {!isPending && !isError && rows.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center">
                {t('common.noData')}
              </td>
            </tr>
          )}
          {rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

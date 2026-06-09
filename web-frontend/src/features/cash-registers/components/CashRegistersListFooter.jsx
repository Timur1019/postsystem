export default function CashRegistersListFooter({
  t,
  fromN,
  toN,
  total,
  page,
  pageSize,
  pageSizeOptions,
  pageButtons,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between">
      <span>{t('products.recordsRange', { from: fromN, to: toN, total })}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-500">{t('cashRegisters.pageSizePrefix')}</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(0);
          }}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1 sm:flex-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600"
        >
          {t('common.prev')}
        </button>
        {(totalPages <= 1 ? [0] : pageButtons).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => totalPages > 1 && onPageChange(i)}
            disabled={totalPages <= 1}
            className={`min-w-[2rem] rounded border px-2 py-1 text-xs ${
              page === i
                ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages - 1 || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

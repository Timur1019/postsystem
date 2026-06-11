import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../ui';

export const TABLE_PAGE_SIZE_OPTIONS = [10, 14, 20, 50];

function buildPageButtons(totalPages, page) {
  if (totalPages <= 0) return [0];
  if (totalPages <= 1) return [0];
  const maxBtns = 5;
  if (totalPages <= maxBtns) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  let start = Math.max(0, page - 2);
  let end = Math.min(totalPages, start + maxBtns);
  start = Math.max(0, end - maxBtns);
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export default function TablePagination({
  page,
  pageSize,
  total,
  totalPages: totalPagesProp,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  className = '',
}) {
  const { t } = useTranslation();

  const totalPages = totalPagesProp ?? (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1);
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  const pageButtons = useMemo(() => buildPageButtons(totalPages, page), [totalPages, page]);
  const showEllipsisBefore = totalPages > 5 && pageButtons.length > 0 && pageButtons[0] > 0;
  const showEllipsisAfter =
    totalPages > 5 && pageButtons.length > 0 && pageButtons[pageButtons.length - 1] < totalPages - 1;

  const displayButtons = totalPages <= 1 ? [0] : pageButtons;

  return (
    <div
      className={`flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>{t('products.recordsRange', { from, to, total })}</span>
        {onPageSizeChange ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-500">{t('cashRegisters.pageSizePrefix')}</span>
            <BaseSelect
              size="sm"
              value={pageSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                if (nextSize !== pageSize) {
                  onPageChange(0);
                  onPageSizeChange(nextSize);
                }
              }}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {t('common.prev')}
        </button>
        {showEllipsisBefore ? (
          <>
            <button
              type="button"
              onClick={() => onPageChange(0)}
              className="min-w-[2.5rem] rounded border border-slate-300 px-2.5 py-1.5 text-sm dark:border-slate-600"
            >
              1
            </button>
            <span className="px-1 text-slate-400">…</span>
          </>
        ) : null}
        {displayButtons.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => totalPages > 1 && onPageChange(i)}
            disabled={totalPages <= 1 && i !== page}
            className={`min-w-[2.5rem] rounded border px-2.5 py-1.5 text-sm ${
              page === i
                ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
        {showEllipsisAfter ? (
          <>
            <span className="px-1 text-slate-400">…</span>
            <button
              type="button"
              onClick={() => onPageChange(totalPages - 1)}
              className="min-w-[2.5rem] rounded border border-slate-300 px-2.5 py-1.5 text-sm dark:border-slate-600"
            >
              {totalPages}
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={page >= totalPages - 1 || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="rounded px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

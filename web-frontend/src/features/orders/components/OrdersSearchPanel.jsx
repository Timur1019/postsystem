import { Filter } from 'lucide-react';

export default function OrdersSearchPanel({
  t,
  search,
  onSearchChange,
  onSearchApply,
  onOpenFilters,
}) {
  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearchApply();
                }
              }}
              placeholder={t('orders.searchPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{t('orders.searchHint')}</p>
          </div>
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            <Filter size={18} />
            {t('orders.filters')}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
        <span className="mr-1.5 inline-block text-sky-600 dark:text-sky-400">ⓘ</span>
        {t('orders.infoEditRule')}
      </div>
    </>
  );
}

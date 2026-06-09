export default function ProductFiltersDrawerFooter({ t, onReset, onApply }) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {t('products.filters.reset')}
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {t('common.apply')}
      </button>
    </div>
  );
}

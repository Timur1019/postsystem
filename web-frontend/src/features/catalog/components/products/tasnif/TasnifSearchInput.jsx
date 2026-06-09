import { Loader, Search } from 'lucide-react';

const inputCls = `tasnif-search__input w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
  dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`;

export default function TasnifSearchInput({ t, query, onQueryChange, onSearch, loading }) {
  return (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
        {t('productCatalog.tasnifSearchTitle')}
      </p>
      <div className="tasnif-search__row">
        <input
          className={inputCls}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearch();
            }
          }}
          placeholder={t('productCatalog.tasnifSearchPh')}
          disabled={loading}
        />
        <button type="button" className="tasnif-search__btn" onClick={onSearch} disabled={loading}>
          {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} className="inline" />}
          <span className="ml-1.5 hidden sm:inline">{t('productCatalog.tasnifSearchBtn')}</span>
        </button>
      </div>
      <p className="tasnif-search__hint">{t('productCatalog.tasnifSearchHint')}</p>
    </>
  );
}

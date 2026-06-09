import { Loader, Search } from 'lucide-react';
import { buildCatalogResultMeta } from '../../utils/usersBarcodePrintUtils';
import { barcodePrintInputCls } from './barcodePrintFormUi';

export default function BarcodePrintSearchSection({
  t,
  searchRef,
  query,
  onQueryChange,
  onLookup,
  loading,
  catalogResults,
  tasnifResults,
  onCatalogPick,
  onTasnifPick,
}) {
  return (
    <section className="barcode-print-page__card">
      <p className="barcode-print-page__card-title">{t('usersBarcodePrint.searchLabel')}</p>
      <div className="flex gap-2">
        <input
          ref={searchRef}
          className={barcodePrintInputCls}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onLookup();
            }
          }}
          placeholder={t('usersBarcodePrint.searchPh')}
        />
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          onClick={() => onLookup()}
          disabled={loading}
        >
          {loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('usersBarcodePrint.searchHint')}</p>

      {catalogResults.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            {t('usersBarcodePrint.catalogResultsTitle')}
          </p>
          <div className="tasnif-search__results rounded-lg border border-emerald-200 dark:border-emerald-800">
            {catalogResults.map((product) => (
              <button
                key={product.id}
                type="button"
                className="tasnif-search__item flex w-full flex-col border-b border-slate-100 text-left dark:border-slate-700"
                onClick={() => onCatalogPick(product)}
              >
                <div className="tasnif-search__item-name font-medium">{product.name}</div>
                <div className="tasnif-search__item-meta text-xs opacity-90">
                  {buildCatalogResultMeta(product, t)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tasnifResults.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('usersBarcodePrint.tasnifResultsTitle')}
          </p>
          <div className="tasnif-search__results rounded-lg border border-slate-200 dark:border-slate-600">
            {tasnifResults.map((item) => (
              <button
                key={`${item.mxik}-${item.name}`}
                type="button"
                className="tasnif-search__item flex w-full flex-col border-b border-slate-100 text-left dark:border-slate-700"
                onClick={() => onTasnifPick(item)}
              >
                <div className="tasnif-search__item-name font-medium">{item.name}</div>
                <div className="tasnif-search__item-meta text-xs opacity-90">
                  {t('productCatalog.ikpu')}: {item.mxik}
                  {item.barcode || item.internalCode
                    ? ` · ${t('productModal.barcode')}: ${item.barcode || item.internalCode}`
                    : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

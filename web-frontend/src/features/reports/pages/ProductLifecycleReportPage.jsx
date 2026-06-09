import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, History } from 'lucide-react';
import { ProductLifecycleSection } from '../../catalog';
import { useProductLifecycleReportPage } from '../hooks/useProductLifecycleReportPage';

export default function ProductLifecycleReportPage() {
  const { t } = useTranslation();
  const r = useProductLifecycleReportPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('stockReports.lifecycleTitle')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('stockReports.lifecycleSubtitle')}
        </p>
      </div>

      <div className="relative max-w-xl">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={r.search}
            onChange={(e) => r.handleSearchChange(e.target.value)}
            onFocus={() => r.setPickerOpen(true)}
            placeholder={t('stockReports.lifecycleSearchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none dark:text-white"
          />
        </div>

        {r.pickerOpen && r.debouncedSearch.length >= 2 && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {r.searchLoading && (
              <p className="px-3 py-2 text-sm text-slate-500">{t('common.loading')}</p>
            )}
            {!r.searchLoading && r.candidates.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">{t('stockReports.lifecycleSearchEmpty')}</p>
            )}
            {r.candidates.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => r.selectProduct(product.id)}
                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                <span className="font-mono text-xs text-slate-500">
                  {product.sku}
                  {product.barcode ? ` · ${product.barcode}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {r.selectedProduct && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <History size={20} className="text-emerald-700 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">{r.selectedProduct.name}</p>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {t('products.colSku')}: {r.selectedProduct.sku}
              {r.selectedProduct.barcode ? ` · ${r.selectedProduct.barcode}` : ''}
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {t('stockReports.lifecycleOpenCatalog')}
          </Link>
        </div>
      )}

      {!r.selectedId && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600">
          {t('stockReports.lifecyclePickProduct')}
        </p>
      )}

      {r.selectedId && <ProductLifecycleSection productId={r.selectedId} showStoreFilter />}
    </div>
  );
}

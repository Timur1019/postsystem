import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, History } from 'lucide-react';
import { productApi } from '../../services/api';
import ProductLifecycleSection from '../../components/products/ProductLifecycleSection';

export default function ProductLifecycleReportPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const productIdFromUrl = searchParams.get('productId') || '';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState(productIdFromUrl);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const tmr = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(tmr);
  }, [search]);

  useEffect(() => {
    if (productIdFromUrl) {
      setSelectedId(productIdFromUrl);
    }
  }, [productIdFromUrl]);

  const { data: searchResults, isFetching: searchLoading } = useQuery({
    queryKey: ['product-lifecycle-search', debouncedSearch],
    queryFn: () =>
      productApi
        .getAll({ search: debouncedSearch, page: 0, size: 12, activeOnly: true })
        .then((r) => r.data),
    enabled: debouncedSearch.length >= 2,
    placeholderData: keepPreviousData,
  });

  const { data: selectedProduct } = useQuery({
    queryKey: ['product', selectedId],
    queryFn: () => productApi.getById(selectedId).then((r) => r.data),
    enabled: !!selectedId,
  });

  const candidates = useMemo(() => searchResults?.content ?? [], [searchResults]);

  const selectProduct = (id) => {
    setSelectedId(id);
    setPickerOpen(false);
    setSearch('');
    setDebouncedSearch('');
    setSearchParams(id ? { productId: id } : {}, { replace: true });
  };

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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPickerOpen(true);
            }}
            onFocus={() => setPickerOpen(true)}
            placeholder={t('stockReports.lifecycleSearchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none dark:text-white"
          />
        </div>

        {pickerOpen && debouncedSearch.length >= 2 && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {searchLoading && (
              <p className="px-3 py-2 text-sm text-slate-500">{t('common.loading')}</p>
            )}
            {!searchLoading && candidates.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">{t('stockReports.lifecycleSearchEmpty')}</p>
            )}
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProduct(p.id)}
                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                <span className="font-mono text-xs text-slate-500">
                  {p.sku}
                  {p.barcode ? ` · ${p.barcode}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <History size={20} className="text-emerald-700 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">{selectedProduct.name}</p>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {t('products.colSku')}: {selectedProduct.sku}
              {selectedProduct.barcode ? ` · ${selectedProduct.barcode}` : ''}
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

      {!selectedId && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600">
          {t('stockReports.lifecyclePickProduct')}
        </p>
      )}

      {selectedId && <ProductLifecycleSection productId={selectedId} showStoreFilter />}
    </div>
  );
}

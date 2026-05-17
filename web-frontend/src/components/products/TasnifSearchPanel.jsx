import { useState } from 'react';
import { Loader, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { tasnifApi } from '../../services/api';
import TasnifPackagePickerModal from './TasnifPackagePickerModal';
import '../../styles/tasnif-search.css';

const inputCls = `tasnif-search__input w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
  dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`;

export default function TasnifSearchPanel({ setValue, getValues, isEdit }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'uz';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [packageItem, setPackageItem] = useState(null);
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');

  const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

  const resolveBarcode = (item, searchQuery) => {
    const fromApi = item?.barcode || item?.internalCode;
    if (fromApi && String(fromApi).trim()) {
      return String(fromApi).trim();
    }
    const q = digitsOnly(searchQuery);
    if (q.length >= 8) {
      return q;
    }
    return '';
  };

  const applyToForm = (item, pkg, searchQuery = '') => {
    if (!item?.name) return;
    setValue('name', item.name, { shouldDirty: true, shouldValidate: true });
    if (item.mxik) {
      setValue('ikpu', item.mxik, { shouldDirty: true });
    }
    const barcode = resolveBarcode(item, searchQuery);
    if (barcode) {
      setValue('barcode', barcode, { shouldDirty: true });
    }
    if (pkg) {
      const unit =
        lang === 'ru'
          ? pkg.nameRu || pkg.nameUz || pkg.nameLat
          : pkg.nameUz || pkg.nameRu || pkg.nameLat;
      if (unit) {
        setValue('unitOfMeasure', unit, { shouldDirty: true });
      }
      if (pkg.packageType) {
        setValue('unitMeasureCode', pkg.packageType, { shouldDirty: true });
      }
      if (pkg.code) {
        setValue('packageCode', pkg.code, { shouldDirty: true });
      }
    }
    setValue('markedProduct', !!item.markedProduct, { shouldDirty: true });
    if (!isEdit && item.mxik) {
      const sku = getValues('sku');
      if (!sku?.trim()) {
        setValue('sku', `IKPU-${item.mxik}`, { shouldDirty: true });
      }
    }
    toast.success(t('productCatalog.mxikApplied'));
    setResults([]);
    setQuery('');
  };

  const pickItem = async (item) => {
    const searchQuery = query.trim();
    let full = item;
    if (item.mxik) {
      try {
        const res = await tasnifApi.detail({ mxik: item.mxik, lang });
        full = res.data;
      } catch {
        /* use search row as-is */
      }
    }
    const packages = full.packages ?? [];
    if (packages.length > 1) {
      setPendingSearchQuery(searchQuery);
      setPackageItem(full);
      return;
    }
    applyToForm(full, packages[0] ?? null, searchQuery);
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      toast.error(t('productCatalog.mxikQueryTooShort'));
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const res = await tasnifApi.search({ q, lang, page: 0, size: 25 });
      const items = res.data?.items ?? [];
      if (!items.length) {
        toast.error(t('productCatalog.mxikNotFound'));
      }
      setResults(items);
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('productCatalog.mxikLookupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="tasnif-search">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
          {t('productCatalog.tasnifSearchTitle')}
        </p>
        <div className="tasnif-search__row">
          <input
            className={inputCls}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
              }
            }}
            placeholder={t('productCatalog.tasnifSearchPh')}
            disabled={loading}
          />
          <button type="button" className="tasnif-search__btn" onClick={runSearch} disabled={loading}>
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} className="inline" />}
            <span className="ml-1.5 hidden sm:inline">{t('productCatalog.tasnifSearchBtn')}</span>
          </button>
        </div>
        <p className="tasnif-search__hint">{t('productCatalog.tasnifSearchHint')}</p>

        {results.length > 0 && (
          <div className="tasnif-search__results">
            {results.map((item) => (
              <button
                key={item.mxik}
                type="button"
                className="tasnif-search__item"
                onClick={() => pickItem(item)}
              >
                <div className="tasnif-search__item-name">{item.name}</div>
                <div className="tasnif-search__item-meta">
                  {t('productCatalog.ikpu')}: {item.mxik}
                  {(item.barcode || item.internalCode)
                    ? ` · ${t('productModal.barcode')}: ${item.barcode || item.internalCode}`
                    : ''}
                  {item.packages?.length ? ` · ${t('productCatalog.packagesCount', { count: item.packages.length })}` : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <TasnifPackagePickerModal
        open={!!packageItem}
        item={packageItem}
        lang={lang}
        onSelect={(pkg) => {
          applyToForm(packageItem, pkg, pendingSearchQuery);
          setPackageItem(null);
          setPendingSearchQuery('');
        }}
        onClose={() => setPackageItem(null)}
      />
    </>
  );
}

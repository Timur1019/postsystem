import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader, Printer, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi, tasnifApi } from '../services/api';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import TasnifPackagePickerModal from '../components/products/TasnifPackagePickerModal';
import ShelfLabelPrintModal from '../components/users/ShelfLabelPrintModal';
import '../styles/tasnif-search.css';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

const CATALOG_SEARCH_SIZE = 25;

const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

function resolveBarcodeFromProduct(data, fallback = '') {
  const main = data?.barcode && String(data.barcode).trim();
  if (main) return main;
  const extra = Array.isArray(data?.barcodes)
    ? data.barcodes.find((b) => String(b || '').trim())
    : null;
  if (extra) return String(extra).trim();
  const fb = String(fallback || '').replace(/\s/g, '').trim();
  return fb;
}

function resolveBarcodeFromItem(item, searchQuery) {
  const fromApi = item?.barcode || item?.internalCode;
  if (fromApi && String(fromApi).trim()) {
    return String(fromApi).trim();
  }
  const q = digitsOnly(searchQuery);
  if (q.length >= 8) {
    return q;
  }
  return '';
}

export default function UsersBarcodePrintPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'uz';

  const searchRef = useRef(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [priceInput, setPriceInput] = useState('0');
  const [catalogResults, setCatalogResults] = useState([]);
  const [tasnifResults, setTasnifResults] = useState([]);
  const [packageItem, setPackageItem] = useState(null);
  const [pendingQuery, setPendingQuery] = useState('');
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (draft) {
      setPriceInput(String(draft.price ?? 0));
    }
  }, [draft]);

  const setDraftItem = useCallback((next) => {
    setDraft(next);
    setPrintOpen(false);
  }, []);

  const applyCatalogProduct = useCallback(
    (data, searchQuerySaved = '') => {
      if (!data?.name) return false;
      const barcode = resolveBarcodeFromProduct(data, searchQuerySaved);
      setDraftItem({
        name: data.name,
        barcode,
        price:
          typeof data.sellingPrice === 'number'
            ? data.sellingPrice
            : parseFloat(data.sellingPrice) || 0,
        source: 'catalog',
        mxik: data.ikpu ?? null,
      });
      toast.success(t('usersBarcodePrint.foundInCatalog'));
      setCatalogResults([]);
      setTasnifResults([]);
      setQuery('');
      setPackageItem(null);
      setPendingQuery('');
      return true;
    },
    [setDraftItem, t]
  );

  const applyTasnifToDraft = useCallback(
    (item, pkg, searchQuerySaved) => {
      if (!item?.name) {
        toast.error(t('productCatalog.mxikNotFound'));
        return;
      }
      let unitLabel = '';
      if (pkg) {
        unitLabel =
          lang === 'ru'
            ? pkg.nameRu || pkg.nameUz || pkg.nameLat
            : pkg.nameUz || pkg.nameRu || pkg.nameLat;
      }
      const barcode = resolveBarcodeFromItem(item, searchQuerySaved);
      const nameSuffix = unitLabel ? ` (${String(unitLabel).trim()})` : '';
      setDraftItem({
        name: `${item.name.trim()}${nameSuffix}`,
        barcode: barcode || searchQuerySaved.replace(/\s/g, ''),
        price: 0,
        source: 'tasnif',
        mxik: item.mxik ?? null,
      });
      toast.success(t('usersBarcodePrint.foundViaTasnif'));
      setCatalogResults([]);
      setTasnifResults([]);
      setQuery('');
      setPackageItem(null);
      setPendingQuery('');
    },
    [lang, setDraftItem, t]
  );

  const pickTasnifItem = useCallback(
    async (item) => {
      const searchQuerySaved = query.trim() || pendingQuery.trim();
      let full = item;
      if (item.mxik) {
        try {
          const res = await tasnifApi.detail({ mxik: item.mxik, lang });
          full = res.data;
        } catch {
          /* оставить строку из поиска */
        }
      }
      const packages = full.packages ?? [];
      if (packages.length > 1) {
        setPendingQuery(searchQuerySaved);
        setPackageItem(full);
        return;
      }
      applyTasnifToDraft(full, packages[0] ?? null, searchQuerySaved);
    },
    [applyTasnifToDraft, lang, pendingQuery, query]
  );

  /** Поиск в своём каталоге: название, артикул, штрихкод, ИКПУ */
  const searchCatalog = useCallback(
    async (raw) => {
      const { data } = await productApi.getAll({
        search: raw,
        activeOnly: true,
        page: 0,
        size: CATALOG_SEARCH_SIZE,
      });
      const items = data?.content ?? [];
      if (items.length === 1) {
        applyCatalogProduct(items[0], raw);
        return 'done';
      }
      if (items.length > 1) {
        setCatalogResults(items);
        setTasnifResults([]);
        toast(t('usersBarcodePrint.pickFromCatalogHint'), { icon: 'ℹ️' });
        return 'pick-catalog';
      }
      return 'none';
    },
    [applyCatalogProduct, t]
  );

  const runLookup = useCallback(
    async (rawArg) => {
      const raw = (rawArg != null ? String(rawArg) : query).trim();
      if (raw.length < 2) {
        toast.error(t('productCatalog.mxikQueryTooShort'));
        return;
      }

      setLoading(true);
      setPrintOpen(false);
      setCatalogResults([]);
      setTasnifResults([]);
      try {
        try {
          const { data } = await productApi.getByBarcode(raw);
          if (applyCatalogProduct(data, raw)) {
            return;
          }
        } catch {
          /* нет точного совпадения по штрихкоду */
        }

        const catalogHit = await searchCatalog(raw);
        if (catalogHit === 'done' || catalogHit === 'pick-catalog') {
          return;
        }

        const digitKey = digitsOnly(raw);

        async function tasLookup(code) {
          if (!code) return null;
          try {
            const { data } = await tasnifApi.lookup({ barcode: code.trim(), lang });
            return data;
          } catch {
            return null;
          }
        }

        let lk = digitKey.length >= 8 ? await tasLookup(digitKey) : null;
        if (!lk) lk = await tasLookup(raw);
        if (!lk && digitKey.length >= 8 && digitKey !== raw) lk = await tasLookup(`${digitKey}`);
        if (lk) {
          const fakeItem = {
            mxik: lk.mxik,
            name: lk.name || lk.description,
            barcode: lk.barcode,
            packages: lk.usePackage ? [] : [],
          };
          if (fakeItem.mxik) {
            try {
              const res = await tasnifApi.detail({ mxik: fakeItem.mxik, lang });
              const full = res.data;
              const packages = full.packages ?? [];
              if (packages.length > 1) {
                setPendingQuery(raw);
                setPackageItem(full);
                return;
              }
              applyTasnifToDraft(full, packages[0] ?? null, raw);
              return;
            } catch {
              applyTasnifToDraft(fakeItem, null, raw);
              return;
            }
          }
          applyTasnifToDraft(fakeItem, null, raw);
          return;
        }

        setPendingQuery(raw);
        const { data } = await tasnifApi.search({ q: raw, lang, page: 0, size: 20 });
        const items = data?.items ?? [];
        if (!items.length) {
          toast.error(t('usersBarcodePrint.notFoundAnywhere'));
          return;
        }
        if (items.length === 1) {
          await pickTasnifItem(items[0]);
          return;
        }
        setTasnifResults(items);
        toast(t('usersBarcodePrint.pickFromListHint'), { icon: 'ℹ️' });
      } catch (err) {
        toast.error(err.response?.data?.message ?? t('productCatalog.mxikLookupFailed'));
      } finally {
        setLoading(false);
      }
    },
    [applyCatalogProduct, applyTasnifToDraft, lang, pickTasnifItem, query, searchCatalog, t]
  );

  useBarcodeScanner({
    enabled: true,
    barcodeInputRef: searchRef,
    onScan: (code) => {
      setQuery(code);
      runLookup(code);
    },
  });

  const previewPrice =
    priceInput.trim() === '' ? 0 : Math.max(0, parseFloat(priceInput.replace(',', '.')) || 0);

  const renderCatalogMeta = (p) => {
    const parts = [];
    if (p.ikpu) parts.push(`${t('productCatalog.ikpu')}: ${p.ikpu}`);
    if (p.sku) parts.push(`${t('products.colSku')}: ${p.sku}`);
    const bc = resolveBarcodeFromProduct(p);
    if (bc) parts.push(`${t('productModal.barcode')}: ${bc}`);
    return parts.join(' · ');
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t('usersBarcodePrint.title')}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('usersBarcodePrint.intro')}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('usersBarcodePrint.searchLabel')}
        </label>
        <div className="flex gap-2">
          <input
            ref={searchRef}
            className={inputCls}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runLookup();
              }
            }}
            placeholder={t('usersBarcodePrint.searchPh')}
          />
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={() => runLookup()}
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
              {catalogResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="tasnif-search__item flex w-full flex-col border-b border-slate-100 text-left dark:border-slate-700"
                  onClick={() => applyCatalogProduct(p, query.trim() || pendingQuery.trim())}
                >
                  <div className="tasnif-search__item-name font-medium">{p.name}</div>
                  <div className="tasnif-search__item-meta text-xs opacity-90">{renderCatalogMeta(p)}</div>
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
                  onClick={() => pickTasnifItem(item)}
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
      </div>

      {draft && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('usersBarcodePrint.currentItem')}</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              {draft.source === 'catalog' ? t('usersBarcodePrint.sourceCatalog') : t('usersBarcodePrint.sourceTasnif')}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs text-slate-500">{t('products.colName')}</label>
              <p className="font-medium text-slate-900 dark:text-white">{draft.name}</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500">{t('productModal.barcode')}</label>
              <p className="font-mono text-slate-900 dark:text-white">{draft.barcode || '—'}</p>
            </div>
            {draft.mxik && (
              <div>
                <label className="block text-xs text-slate-500">{t('productCatalog.ikpu')}</label>
                <p className="font-mono text-slate-900 dark:text-white">{draft.mxik}</p>
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500">{t('products.colPrice')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputCls} max-w-[12rem]`}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{t('usersBarcodePrint.priceHint')}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!draft?.barcode?.trim()) {
                  toast.error(t('usersBarcodePrint.noBarcodeForPrint'));
                  return;
                }
                setPrintOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <Printer size={18} />
              {t('usersBarcodePrint.openPrint')}
            </button>
          </div>
        </section>
      )}

      <TasnifPackagePickerModal
        open={!!packageItem}
        item={packageItem}
        lang={lang}
        onSelect={(pkg) => {
          if (packageItem) {
            applyTasnifToDraft(packageItem, pkg, pendingQuery);
          }
        }}
        onClose={() => {
          setPackageItem(null);
        }}
      />

      <ShelfLabelPrintModal
        open={printOpen && !!draft}
        onClose={() => setPrintOpen(false)}
        productName={draft?.name ?? ''}
        barcode={draft?.barcode ?? ''}
        price={previewPrice}
        autoLabelPrint
        defaultVariant="priceTag"
      />
    </div>
  );
}

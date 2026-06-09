import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi, tasnifApi } from '../../../api';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import {
  digitsOnly,
  resolveLabelBarcodeFromProduct,
  resolveLabelBarcodeFromTasnif,
} from '../../../utils/labelBarcode';
import { BARCODE_PRINT_CATALOG_SEARCH_SIZE, loadCatalogProductDetails } from '../utils/usersBarcodePrintUtils';

export function useUsersBarcodePrintPage() {
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
  }, []);

  const clearSearchResults = useCallback(() => {
    setCatalogResults([]);
    setTasnifResults([]);
    setQuery('');
    setPackageItem(null);
    setPendingQuery('');
  }, []);

  const applyCatalogProduct = useCallback(
    async (data, searchQuerySaved = '') => {
      const full = await loadCatalogProductDetails(data);
      if (!full?.name) return false;
      const barcode = resolveLabelBarcodeFromProduct(full, searchQuerySaved);
      setDraftItem({
        name: full.name,
        barcode,
        price:
          typeof full.sellingPrice === 'number'
            ? full.sellingPrice
            : parseFloat(full.sellingPrice) || 0,
        source: 'catalog',
        mxik: full.ikpu ?? null,
      });
      toast.success(t('usersBarcodePrint.foundInCatalog'));
      clearSearchResults();
      return true;
    },
    [clearSearchResults, setDraftItem, t]
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
      const barcode = resolveLabelBarcodeFromTasnif(item, searchQuerySaved, pkg);
      const nameSuffix = unitLabel ? ` (${String(unitLabel).trim()})` : '';
      setDraftItem({
        name: `${item.name.trim()}${nameSuffix}`,
        barcode,
        price: 0,
        source: 'tasnif',
        mxik: item.mxik ?? null,
      });
      toast.success(t('usersBarcodePrint.foundViaTasnif'));
      clearSearchResults();
    },
    [clearSearchResults, lang, setDraftItem, t]
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
          /* keep search row */
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

  const searchCatalog = useCallback(
    async (raw) => {
      const { data } = await productApi.getAll({
        search: raw,
        activeOnly: true,
        page: 0,
        size: BARCODE_PRINT_CATALOG_SEARCH_SIZE,
      });
      const items = data?.content ?? [];
      if (items.length === 1) {
        await applyCatalogProduct(items[0], raw);
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
      setCatalogResults([]);
      setTasnifResults([]);
      try {
        try {
          const { data } = await productApi.getByBarcode(raw);
          if (await applyCatalogProduct(data, raw)) {
            return;
          }
        } catch {
          /* no exact barcode match */
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

  const handlePackageSelect = useCallback(
    (pkg) => {
      if (packageItem) {
        applyTasnifToDraft(packageItem, pkg, pendingQuery);
      }
    },
    [applyTasnifToDraft, packageItem, pendingQuery]
  );

  const handlePackageClose = useCallback(() => {
    setPackageItem(null);
  }, []);

  const handleCatalogPick = useCallback(
    (product) => {
      void applyCatalogProduct(product, query.trim() || pendingQuery.trim());
    },
    [applyCatalogProduct, pendingQuery, query]
  );

  const handleOpenPrint = useCallback(() => {
    if (!draft?.barcode?.trim()) {
      toast.error(t('usersBarcodePrint.noBarcodeForPrint'));
      return;
    }
    setPrintOpen(true);
  }, [draft, t]);

  const handleClosePrint = useCallback(() => {
    setPrintOpen(false);
  }, []);

  return {
    t,
    lang,
    searchRef,
    query,
    setQuery,
    loading,
    draft,
    priceInput,
    setPriceInput,
    catalogResults,
    tasnifResults,
    packageItem,
    pendingQuery,
    printOpen,
    previewPrice,
    runLookup,
    pickTasnifItem,
    handleCatalogPick,
    handlePackageSelect,
    handlePackageClose,
    handleOpenPrint,
    handleClosePrint,
  };
}

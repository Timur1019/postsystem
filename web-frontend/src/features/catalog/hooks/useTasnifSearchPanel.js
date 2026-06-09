import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { tasnifApi } from '../../../api';
import { resolveLabelBarcodeFromTasnif } from '../../../utils/labelBarcode';

export function useTasnifSearchPanel({ setValue, getValues, isEdit }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'uz';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [packageItem, setPackageItem] = useState(null);
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');

  const applyToForm = (item, pkg, searchQuery = '') => {
    if (!item?.name) return;
    setValue('name', item.name, { shouldDirty: true, shouldValidate: true });
    if (item.mxik) {
      setValue('ikpu', item.mxik, { shouldDirty: true });
    }
    const barcode = resolveLabelBarcodeFromTasnif(item, searchQuery, pkg);
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

  const handlePackageSelect = (pkg) => {
    applyToForm(packageItem, pkg, pendingSearchQuery);
    setPackageItem(null);
    setPendingSearchQuery('');
  };

  const handlePackageClose = () => setPackageItem(null);

  return {
    t,
    lang,
    query,
    setQuery,
    loading,
    results,
    packageItem,
    runSearch,
    pickItem,
    handlePackageSelect,
    handlePackageClose,
  };
}

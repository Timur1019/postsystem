import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi } from '../../../api';
import {
  applyMarkup,
  buildEditableRows,
  isRowDuplicate,
  isRowInvalid,
  isRowNew,
  parseMoneyInput,
  parsePercentInput,
} from '../../../utils/productImportUtils';

export function useProductImport(onClose) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('AS_FILE');
  const [source, setSource] = useState('UZ_INVOICE');
  const [step, setStep] = useState('setup');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [markupPercent, setMarkupPercent] = useState(0);
  const [markupInput, setMarkupInput] = useState('0');
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [defaultStoreId, setDefaultStoreId] = useState('');
  const [defaultStorageLocation, setDefaultStorageLocation] = useState('');
  const [editable, setEditable] = useState({});
  const fileRef = useRef(null);

  const pickFile = () => fileRef.current?.click();

  const previewOptions = () => ({
    defaultStorageLocation: defaultStorageLocation.trim() || undefined,
  });

  const loadPreview = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await productApi.importPreview(fd, source, previewOptions());
    setPreview(data);
    setEditable(buildEditableRows(data?.rows ?? [], markupPercent));
    setStep('preview');
    return data;
  };

  const refreshPreview = async () => {
    if (!pendingFile) return;
    try {
      await loadPreview(pendingFile);
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('products.import.failed'));
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    try {
      await loadPreview(file);
    } catch (err) {
      const msg =
        err.response?.data?.message
        ?? err.response?.data?.errors?.file
        ?? t('products.import.failed');
      toast.error(msg, { duration: 6000 });
    }
    e.target.value = '';
  };

  const syncMarkupField = (percent) => {
    setMarkupPercent(percent);
    setMarkupInput(String(percent));
  };

  const onMarkupInputChange = (raw) => {
    setMarkupInput(raw);
    const parsed = parsePercentInput(raw);
    if (parsed != null) setMarkupPercent(parsed);
  };

  const onMarkupInputBlur = () => {
    const parsed = parsePercentInput(markupInput);
    if (parsed == null) {
      setMarkupInput(String(markupPercent));
      return;
    }
    syncMarkupField(parsed);
  };

  const applyMarkupPreset = (percent) => {
    syncMarkupField(percent);
    setEditable((prev) => {
      const next = { ...prev };
      (preview?.rows ?? []).forEach((r) => {
        if (!isRowNew(r) || !next[r.rowNum]) return;
        next[r.rowNum] = {
          ...next[r.rowNum],
          importPrice: applyMarkup(r.fileSellingPrice, percent),
        };
      });
      return next;
    });
  };

  const applyMarkupToAll = () => {
    setEditable((prev) => {
      const next = { ...prev };
      (preview?.rows ?? []).forEach((r) => {
        if (!isRowNew(r) || !next[r.rowNum]) return;
        next[r.rowNum] = {
          ...next[r.rowNum],
          importPrice: applyMarkup(r.fileSellingPrice, markupPercent),
        };
      });
      return next;
    });
  };

  const setRowPrice = (rowNum, raw) => {
    const parsed = parseMoneyInput(raw);
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], importPrice: parsed ?? prev[rowNum]?.importPrice },
    }));
  };

  const setRowCategory = (rowNum, categoryId) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], categoryId },
    }));
  };

  const applyDefaultCategoryToAll = () => {
    if (!defaultCategoryId) return;
    setEditable((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], categoryId: defaultCategoryId };
      });
      return next;
    });
  };

  const setRowStore = (rowNum, storeId) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], storeId },
    }));
  };

  const applyDefaultStoreToAll = () => {
    if (!defaultStoreId) return;
    setEditable((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], storeId: defaultStoreId };
      });
      return next;
    });
  };

  const setRowStorageLocation = (rowNum, storageLocation) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], storageLocation },
    }));
  };

  const applyDefaultLocationToAll = () => {
    const loc = defaultStorageLocation.trim();
    if (!loc) return;
    setEditable((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], storageLocation: loc };
      });
      return next;
    });
  };

  const rows = preview?.rows ?? [];
  const canImport = rows.some((r) => isRowNew(r));
  const allDuplicates =
    rows.length > 0 && rows.every((r) => isRowDuplicate(r) || isRowInvalid(r)) && !canImport;

  const runImport = async () => {
    if (!pendingFile) return;
    if (canImport && !defaultStoreId) {
      toast.error(t('products.import.storeRequired'));
      return;
    }
    setImporting(true);
    const fd = new FormData();
    fd.append('file', pendingFile);

    const rowOverrides = rows
      .filter((r) => isRowNew(r) && editable[r.rowNum])
      .map((r) => {
        const ed = editable[r.rowNum];
        const payload = { rowNum: r.rowNum, sellingPrice: Number(ed.importPrice) };
        const catId = ed.categoryId || defaultCategoryId;
        if (catId) payload.categoryId = Number(catId);
        const storeId = ed.storeId || defaultStoreId;
        if (storeId) payload.storeId = Number(storeId);
        const loc = (ed.storageLocation || defaultStorageLocation || '').trim();
        if (loc) payload.storageLocation = loc;
        return payload;
      });

    const options = {
      strategy: mode,
      source,
      skipDuplicates: true,
      defaultCategoryId: defaultCategoryId ? Number(defaultCategoryId) : null,
      defaultStoreId: defaultStoreId ? Number(defaultStoreId) : null,
      defaultStorageLocation: defaultStorageLocation.trim() || null,
      rows: rowOverrides,
    };

    try {
      const { data } = await productApi.importUpload(fd, options);
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      const errs = Array.isArray(data?.errors) ? data.errors : [];

      if (created > 0) {
        const msg =
          skipped > 0
            ? t('products.import.importPartial', { created, skipped })
            : `${t('products.import.done')} · ${t('products.import.created')}: ${created}`;
        toast.success(msg);
        if (errs.length) {
          errs.slice(0, 3).forEach((line) => toast(line, { icon: '⚠️' }));
        }
        onClose();
      } else if (skipped > 0 && errs.length === 0) {
        toast(t('products.import.importOnlySkipped', { skipped }), { icon: 'ℹ️', duration: 5000 });
        try {
          await loadPreview(pendingFile);
        } catch {
          /* preview refresh optional */
        }
      } else {
        toast.error(
          errs[0] ?? data?.message ?? t('products.import.importNothingCreated'),
          { duration: 6000 }
        );
        errs.slice(1, 5).forEach((line) => toast(line, { icon: '⚠️' }));
        if (errs.length > 5) {
          toast(t('products.import.moreErrors', { count: errs.length - 5 }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('products.import.failed'));
    } finally {
      setImporting(false);
    }
  };

  return {
    t,
    mode,
    setMode,
    source,
    setSource,
    step,
    setStep,
    preview,
    importing,
    fileRef,
    markupInput,
    defaultCategoryId,
    setDefaultCategoryId,
    defaultStoreId,
    setDefaultStoreId,
    defaultStorageLocation,
    setDefaultStorageLocation,
    editable,
    rows,
    canImport,
    allDuplicates,
    pickFile,
    onFile,
    onMarkupInputChange,
    onMarkupInputBlur,
    applyMarkupPreset,
    applyMarkupToAll,
    applyDefaultCategoryToAll,
    applyDefaultStoreToAll,
    applyDefaultLocationToAll,
    refreshPreview,
    setRowPrice,
    setRowCategory,
    setRowStore,
    setRowStorageLocation,
    runImport,
  };
}

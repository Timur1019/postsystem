// src/components/products/ProductImportModal.jsx
import { useRef, useState } from 'react';
import { X, AlertTriangle, CheckCircle2, XCircle, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../services/api';
import toast from 'react-hot-toast';
import { fmtMoney } from '../../utils/formatMoney';

const optCls = (active) =>
  `flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
    active
      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
  }`;

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white';

function formatMoney(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return fmtMoney(n);
}

function parseMoneyInput(raw) {
  if (raw == null || raw === '') return null;
  const cleaned = String(raw).replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parsePercentInput(raw) {
  if (raw == null || raw === '') return null;
  const cleaned = String(raw).replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function applyMarkup(base, percent) {
  const n = Number(base);
  if (!Number.isFinite(n)) return base;
  const p = Number(percent) || 0;
  return Math.round(n * (1 + p / 100) * 100) / 100;
}

const statusBadge = (status, t) => {
  if (status === 'DUPLICATE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
        <AlertTriangle size={12} />
        {t('products.import.statusDuplicate')}
      </span>
    );
  }
  if (status === 'INVALID') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-500/20 dark:text-red-300">
        <XCircle size={12} />
        {t('products.import.statusInvalid')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
      <CheckCircle2 size={12} />
      {t('products.import.statusNew')}
    </span>
  );
};

function buildEditableRows(rows, markupPercent) {
  const map = {};
  rows.forEach((r) => {
    if (r.status !== 'NEW') return;
    const base = Number(r.fileSellingPrice);
    map[r.rowNum] = {
      importPrice: applyMarkup(base, markupPercent),
      categoryId: '',
      storeId: '',
    };
  });
  return map;
}

export default function ProductImportModal({ categories = [], stores = [], onClose }) {
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
  const [editable, setEditable] = useState({});
  const fileRef = useRef(null);

  const pickFile = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await productApi.importPreview(fd, source);
      setPreview(data);
      setEditable(buildEditableRows(data?.rows ?? [], markupPercent));
      setStep('preview');
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
        if (r.status !== 'NEW' || !next[r.rowNum]) return;
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
        if (r.status !== 'NEW' || !next[r.rowNum]) return;
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

  const runImport = async () => {
    if (!pendingFile) return;
    if (canImport && !defaultStoreId) {
      toast.error(t('products.import.storeRequired'));
      return;
    }
    setImporting(true);
    const fd = new FormData();
    fd.append('file', pendingFile);

    const rowOverrides = (preview?.rows ?? [])
      .filter((r) => r.status === 'NEW' && editable[r.rowNum])
      .map((r) => {
        const ed = editable[r.rowNum];
        const payload = { rowNum: r.rowNum, sellingPrice: Number(ed.importPrice) };
        const catId = ed.categoryId || defaultCategoryId;
        if (catId) payload.categoryId = Number(catId);
        const storeId = ed.storeId || defaultStoreId;
        if (storeId) payload.storeId = Number(storeId);
        return payload;
      });

    const options = {
      strategy: mode,
      source,
      skipDuplicates: true,
      defaultCategoryId: defaultCategoryId ? Number(defaultCategoryId) : null,
      defaultStoreId: defaultStoreId ? Number(defaultStoreId) : null,
      rows: rowOverrides,
    };

    try {
      const { data } = await productApi.importUpload(fd, options);
      const parts = [
        t('products.import.done'),
        data?.created != null && `${t('products.import.created')}: ${data.created}`,
        data?.skipped != null && data.skipped > 0 && `${t('products.import.skipped')}: ${data.skipped}`,
      ].filter(Boolean);
      toast.success(parts.join(' · '));
      if (Array.isArray(data?.errors) && data.errors.length) {
        data.errors.slice(0, 5).forEach((line) => toast(line, { icon: '⚠️' }));
        if (data.errors.length > 5) {
          toast(t('products.import.moreErrors', { count: data.errors.length - 5 }));
        }
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('products.import.failed'));
    } finally {
      setImporting(false);
    }
  };

  const rows = preview?.rows ?? [];
  const canImport = rows.some((r) => r.status === 'NEW');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="product-import-modal flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <ImportModalHeader title={t('products.import.title')} onClose={onClose} />

        <div className="product-import-modal__body min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {step === 'setup' && (
            <SetupStep
              t={t}
              source={source}
              setSource={setSource}
              mode={mode}
              setMode={setMode}
              optCls={optCls}
            />
          )}

          {step === 'preview' && preview && (
            <PreviewStep
              t={t}
              preview={preview}
              rows={rows}
              markupInput={markupInput}
              onMarkupInputChange={onMarkupInputChange}
              onMarkupInputBlur={onMarkupInputBlur}
              applyMarkupPreset={applyMarkupPreset}
              applyMarkupToAll={applyMarkupToAll}
              defaultCategoryId={defaultCategoryId}
              setDefaultCategoryId={setDefaultCategoryId}
              applyDefaultCategoryToAll={applyDefaultCategoryToAll}
              categories={categories}
              defaultStoreId={defaultStoreId}
              setDefaultStoreId={setDefaultStoreId}
              applyDefaultStoreToAll={applyDefaultStoreToAll}
              stores={stores}
              editable={editable}
              setRowPrice={setRowPrice}
              setRowCategory={setRowCategory}
              setRowStore={setRowStore}
              formatMoney={formatMoney}
              statusBadge={statusBadge}
              inputCls={inputCls}
            />
          )}

          <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.json" onChange={onFile} />
        </div>

        <ImportModalFooter
          step={step}
          setStep={setStep}
          onClose={onClose}
          pickFile={pickFile}
          runImport={runImport}
          canImport={canImport}
          importing={importing}
          t={t}
        />
      </div>
    </div>
  );
}

function ImportModalHeader({ title, onClose }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        <X size={20} />
      </button>
    </div>
  );
}

function SetupStep({ t, source, setSource, mode, setMode, optCls }) {
  return (
    <>
      <a
        href="#"
        className="float-right text-sm text-emerald-600 hover:underline dark:text-emerald-400"
        onClick={async (e) => {
          e.preventDefault();
          try {
            const res = await productApi.importTemplate();
            const blob = new Blob([res.data], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products_import_template.xlsx';
            a.click();
            URL.revokeObjectURL(url);
          } catch {
            toast.error(t('products.import.templateSoon'));
          }
        }}
      >
        {t('products.import.downloadTemplate')}
      </a>

      <p className="text-sm text-slate-600 dark:text-slate-300">{t('products.import.sourceLabel')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {['UZ_INVOICE', 'CATALOG'].map((key) => (
          <label key={key} className={optCls(source === key)}>
            <input
              type="radio"
              name="src"
              checked={source === key}
              onChange={() => setSource(key)}
              className="mt-1"
            />
            <span className="text-sm text-slate-800 dark:text-slate-200">
              {t(`products.import.source.${key}`)}
            </span>
          </label>
        ))}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">{t('products.import.question')}</p>
      <div className="space-y-2">
        {['AS_FILE', 'TO_STORES', 'TO_CATALOG'].map((key) => (
          <label key={key} className={optCls(mode === key)}>
            <input type="radio" name="im" checked={mode === key} onChange={() => setMode(key)} className="mt-1" />
            <span className="text-sm text-slate-800 dark:text-slate-200">{t(`products.import.mode.${key}`)}</span>
          </label>
        ))}
      </div>
    </>
  );
}

function PreviewStep({
  t,
  preview,
  rows,
  markupInput,
  onMarkupInputChange,
  onMarkupInputBlur,
  applyMarkupPreset,
  applyMarkupToAll,
  defaultCategoryId,
  setDefaultCategoryId,
  applyDefaultCategoryToAll,
  categories,
  defaultStoreId,
  setDefaultStoreId,
  applyDefaultStoreToAll,
  stores,
  editable,
  setRowPrice,
  setRowCategory,
  setRowStore,
  formatMoney,
  statusBadge,
  inputCls,
}) {
  return (
    <>
      <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>{t('products.import.previewTotal', { count: preview.totalRows })}</span>
        <span className="text-emerald-600 dark:text-emerald-400">
          {t('products.import.previewNew', { count: preview.newRows })}
        </span>
        <span className="text-amber-600 dark:text-amber-400">
          {t('products.import.previewDuplicate', { count: preview.duplicateRows })}
        </span>
        {preview.invalidRows > 0 && (
          <span className="text-red-600 dark:text-red-400">
            {t('products.import.previewInvalid', { count: preview.invalidRows })}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500">{t('products.import.duplicateHint')}</p>
      <p className="text-xs text-slate-500">{t('products.import.priceHint')}</p>
      <p className="text-xs text-slate-500">{t('products.import.storeHint')}</p>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('products.import.markupLabel')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={markupInput}
              onChange={(e) => onMarkupInputChange(e.target.value)}
              onBlur={onMarkupInputBlur}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              aria-label={t('products.import.markupLabel')}
            />
            <span className="text-sm text-slate-500">%</span>
            <button
              type="button"
              onClick={() => applyMarkupPreset(0)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-300"
            >
              {t('products.import.markup0')}
            </button>
            <button
              type="button"
              onClick={() => applyMarkupPreset(10)}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400"
            >
              <Percent size={14} />
              {t('products.import.markup10')}
            </button>
            <button
              type="button"
              onClick={applyMarkupToAll}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-300"
            >
              {t('products.import.applyMarkup')}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('products.import.defaultCategory')}
          </p>
          <div className="flex gap-2">
            <select
              value={defaultCategoryId}
              onChange={(e) => setDefaultCategoryId(e.target.value)}
              className={inputCls}
            >
              <option value="">{t('products.import.noCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyDefaultCategoryToAll}
              disabled={!defaultCategoryId}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
            >
              {t('products.import.applyCategoryAll')}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('products.import.defaultStore')}
          </p>
          <div className="flex gap-2">
            <select
              value={defaultStoreId}
              onChange={(e) => setDefaultStoreId(e.target.value)}
              className={inputCls}
            >
              <option value="">{t('products.import.noStore')}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyDefaultStoreToAll}
              disabled={!defaultStoreId}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
            >
              {t('products.import.applyStoreAll')}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">{t('products.import.colName')}</th>
                <th className="px-2 py-2 text-right">{t('products.import.colFilePrice')}</th>
                <th className="px-2 py-2 text-right">{t('products.import.colImportPrice')}</th>
                <th className="px-2 py-2">{t('products.import.colCategory')}</th>
                <th className="px-2 py-2">{t('products.import.colStore')}</th>
                <th className="px-2 py-2">{t('products.import.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ed = editable[r.rowNum];
                const isNew = r.status === 'NEW';
                return (
                  <tr
                    key={r.rowNum}
                    className={`border-t border-slate-100 dark:border-slate-800 ${
                      r.status === 'DUPLICATE' ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-2 py-2 text-slate-500">{r.rowNum}</td>
                    <td className="px-2 py-2">
                      <ProductNameCell row={r} />
                    </td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-400">
                      {formatMoney(r.fileSellingPrice)}
                      {r.status === 'DUPLICATE' && r.existingSellingPrice != null && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          {t('products.import.inDb')}: {formatMoney(r.existingSellingPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {isNew && ed ? (
                        <input
                          type="text"
                          className="w-28 rounded border border-slate-300 px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          value={ed.importPrice ?? ''}
                          onChange={(e) => setRowPrice(r.rowNum, e.target.value)}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {isNew && ed ? (
                        <select
                          value={ed.categoryId ?? ''}
                          onChange={(e) => setRowCategory(r.rowNum, e.target.value)}
                          className="min-w-[8rem] rounded border border-slate-300 px-1 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="">{t('products.import.noCategory')}</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {isNew && ed ? (
                        <select
                          value={ed.storeId ?? ''}
                          onChange={(e) => setRowStore(r.rowNum, e.target.value)}
                          className="min-w-[8rem] rounded border border-slate-300 px-1 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="">{t('products.import.noStore')}</option>
                          {stores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {statusBadge(r.status, t)}
                      {r.message && r.status !== 'NEW' && (
                        <div className="mt-1 text-xs text-slate-500">{r.message}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ProductNameCell({ row }) {
  return (
    <>
      <div className="font-mono text-xs text-slate-500">{row.sku}</div>
      <div className="line-clamp-2 text-slate-800 dark:text-slate-200">{row.name}</div>
      {row.status === 'DUPLICATE' && (row.existingSku || row.existingName) && (
        <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          {row.existingSku && <span className="font-mono">{row.existingSku}</span>}
          {row.existingSku && row.existingName && ' · '}
          {row.existingName}
        </div>
      )}
    </>
  );
}

function ImportModalFooter({ step, setStep, onClose, pickFile, runImport, canImport, importing, t }) {
  return (
    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
      {step === 'preview' && (
        <button
          type="button"
          onClick={() => setStep('setup')}
          className="mr-auto rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('products.import.back')}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {t('products.import.close')}
      </button>
      {step === 'setup' ? (
        <button
          type="button"
          onClick={pickFile}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {t('products.import.pickFile')}
        </button>
      ) : (
        <button
          type="button"
          onClick={runImport}
          disabled={!canImport || importing}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {importing ? '…' : t('products.import.confirmImport')}
        </button>
      )}
    </div>
  );
}

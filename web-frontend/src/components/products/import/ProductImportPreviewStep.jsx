import { AlertTriangle, CheckCircle2, Percent, XCircle } from 'lucide-react';
import {
  formatImportMoney,
  inputCls,
  isRowDuplicate,
  isRowInvalid,
  isRowNew,
  normalizeImportStatus,
} from '../../../utils/productImportUtils';
import ProductImportNameCell from './ProductImportNameCell';

function statusBadge(status, t) {
  const s = normalizeImportStatus(status);
  if (s === 'DUPLICATE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
        <AlertTriangle size={12} />
        {t('products.import.statusDuplicate')}
      </span>
    );
  }
  if (s === 'INVALID') {
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
}

export default function ProductImportPreviewStep({
  t,
  preview,
  rows,
  allDuplicates,
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
  defaultStorageLocation,
  setDefaultStorageLocation,
  applyDefaultLocationToAll,
  refreshPreview,
  editable,
  setRowPrice,
  setRowCategory,
  setRowStore,
  setRowStorageLocation,
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
      {preview.uzInvoiceDocumentId ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            preview.invoiceAlreadyImported
              ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-500/15 dark:text-amber-100'
              : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300'
          }`}
        >
          <span className="font-medium">{t('products.import.invoiceDocLabel')}: </span>
          <span className="font-mono">{preview.uzInvoiceDocumentId}</span>
          {preview.invoiceAlreadyImported ? (
            <p className="mt-1 text-xs">
              {t('products.import.invoiceAlreadyImported', { id: preview.uzInvoiceDocumentId })}
            </p>
          ) : null}
        </div>
      ) : null}
      {allDuplicates && preview.duplicateRows > 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-500/10 dark:text-amber-100">
          {t('products.import.invoiceAllDuplicates')}
        </p>
      ) : null}
      <p className="text-xs text-slate-500">{t('products.import.duplicateHint')}</p>
      <p className="text-xs text-slate-500">{t('products.import.priceHint')}</p>
      <p className="text-xs text-slate-500">{t('products.import.storeHint')}</p>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="min-w-[12rem] flex-1">
          <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('products.import.defaultLocation')}
          </p>
          <input
            type="text"
            value={defaultStorageLocation}
            onChange={(e) => setDefaultStorageLocation(e.target.value)}
            onBlur={() => refreshPreview()}
            placeholder={t('products.import.defaultLocationPh')}
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={applyDefaultLocationToAll}
          disabled={!defaultStorageLocation.trim()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
        >
          {t('products.import.applyLocationAll')}
        </button>
      </div>

      <ProductImportPreviewControls
        t={t}
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
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">{t('products.import.colName')}</th>
                <th className="px-2 py-2">{t('products.import.colLocation')}</th>
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
                const isNew = isRowNew(r);
                const isDup = isRowDuplicate(r);
                const isInv = isRowInvalid(r);
                return (
                  <tr
                    key={r.rowNum}
                    className={`border-t border-slate-100 dark:border-slate-800 ${
                      isDup
                        ? 'product-import-row--duplicate bg-amber-100/80 dark:bg-amber-500/15'
                        : isInv
                          ? 'bg-red-50/40 dark:bg-red-500/5'
                          : ''
                    }`}
                  >
                    <td className="px-2 py-2 text-slate-500">{r.rowNum}</td>
                    <td className="px-2 py-2">
                      <ProductImportNameCell row={r} />
                    </td>
                    <td className="px-2 py-2">
                      {isNew && ed ? (
                        <input
                          type="text"
                          value={ed.storageLocation ?? ''}
                          onChange={(e) => setRowStorageLocation(r.rowNum, e.target.value)}
                          placeholder={t('products.import.defaultLocationPh')}
                          className={inputCls}
                        />
                      ) : (
                        <span className="text-slate-500">{r.storageLocation || '—'}</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-400">
                      {formatImportMoney(r.fileSellingPrice)}
                      {isDup && r.existingSellingPrice != null && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          {t('products.import.inDb')}: {formatImportMoney(r.existingSellingPrice)}
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
                      {r.message && !isNew && (
                        <div
                          className={`mt-1 text-xs ${
                            isDup ? 'font-medium text-amber-800 dark:text-amber-200' : 'text-slate-500'
                          }`}
                        >
                          {r.message}
                        </div>
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

function ProductImportPreviewControls({
  t,
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
}) {
  return (
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
  );
}

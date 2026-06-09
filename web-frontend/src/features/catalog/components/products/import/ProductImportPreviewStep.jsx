import { inputCls } from '../../../../../utils/productImportUtils';
import ProductImportPreviewControls from './preview/ProductImportPreviewControls';
import ProductImportPreviewTable from './preview/ProductImportPreviewTable';

export default function ProductImportPreviewStep(props) {
  const {
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
  } = props;

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

      <ProductImportPreviewTable
        t={t}
        rows={rows}
        editable={editable}
        categories={categories}
        stores={stores}
        setRowPrice={setRowPrice}
        setRowCategory={setRowCategory}
        setRowStore={setRowStore}
        setRowStorageLocation={setRowStorageLocation}
      />
    </>
  );
}

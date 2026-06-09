import '../../../../styles/catalog/product-import.css';
import { useProductImport } from '../../hooks/useProductImport';
import ProductImportModalHeader from './import/ProductImportModalHeader';
import ProductImportModalFooter from './import/ProductImportModalFooter';
import ProductImportSetupStep from './import/ProductImportSetupStep';
import ProductImportPreviewStep from './import/ProductImportPreviewStep';

export default function ProductImportModal({ categories = [], stores = [], onClose }) {
  const imp = useProductImport(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="product-import-modal flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <ProductImportModalHeader title={imp.t('products.import.title')} onClose={onClose} />

        <div className="product-import-modal__body min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {imp.step === 'setup' && (
            <ProductImportSetupStep
              t={imp.t}
              source={imp.source}
              setSource={imp.setSource}
              mode={imp.mode}
              setMode={imp.setMode}
            />
          )}

          {imp.step === 'preview' && imp.preview && (
            <ProductImportPreviewStep
              t={imp.t}
              preview={imp.preview}
              rows={imp.rows}
              allDuplicates={imp.allDuplicates}
              markupInput={imp.markupInput}
              onMarkupInputChange={imp.onMarkupInputChange}
              onMarkupInputBlur={imp.onMarkupInputBlur}
              applyMarkupPreset={imp.applyMarkupPreset}
              applyMarkupToAll={imp.applyMarkupToAll}
              defaultCategoryId={imp.defaultCategoryId}
              setDefaultCategoryId={imp.setDefaultCategoryId}
              applyDefaultCategoryToAll={imp.applyDefaultCategoryToAll}
              categories={categories}
              defaultStoreId={imp.defaultStoreId}
              setDefaultStoreId={imp.setDefaultStoreId}
              applyDefaultStoreToAll={imp.applyDefaultStoreToAll}
              stores={stores}
              defaultStorageLocation={imp.defaultStorageLocation}
              setDefaultStorageLocation={imp.setDefaultStorageLocation}
              applyDefaultLocationToAll={imp.applyDefaultLocationToAll}
              refreshPreview={imp.refreshPreview}
              editable={imp.editable}
              setRowPrice={imp.setRowPrice}
              setRowCategory={imp.setRowCategory}
              setRowStore={imp.setRowStore}
              setRowStorageLocation={imp.setRowStorageLocation}
            />
          )}

          <input ref={imp.fileRef} type="file" className="hidden" accept=".xlsx,.xls,.json" onChange={imp.onFile} />
        </div>

        <ProductImportModalFooter
          step={imp.step}
          setStep={imp.setStep}
          onClose={onClose}
          pickFile={imp.pickFile}
          runImport={imp.runImport}
          canImport={imp.canImport}
          allDuplicates={imp.allDuplicates}
          importing={imp.importing}
          t={imp.t}
        />
      </div>
    </div>
  );
}

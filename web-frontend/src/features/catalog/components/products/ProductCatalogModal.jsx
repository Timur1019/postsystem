import { useProductCatalogForm } from '../../hooks/useProductCatalogForm';
import ProductCatalogModalHeader from './catalog/ProductCatalogModalHeader';
import ProductCatalogModalFormBody from './catalog/ProductCatalogModalFormBody';
import ProductCatalogModalFooter from './catalog/ProductCatalogModalFooter';

export default function ProductCatalogModal({
  product,
  categories,
  stores,
  onClose,
  onSaved,
  templateCode = null,
  advancedMode = false,
  universalMode = false,
  selectedStore = null,
  onCreateStoreChange,
  onCreateTemplateChange,
}) {
  const form = useProductCatalogForm(product, stores, onSaved, {
    templateCode,
    advancedMode,
    universalMode,
    selectedStoreId: selectedStore?.id ?? null,
    selectedStoreBusinessType: selectedStore?.businessType ?? null,
  });

  const templateTitle =
    form.templateCode && !form.advancedMode
      ? form.t(`productTemplates.${form.templateCode}.title`)
      : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <ProductCatalogModalHeader
          t={form.t}
          isEdit={form.isEdit}
          universalMode={form.universalMode}
          templateTitle={templateTitle}
          advancedMode={form.advancedMode}
          canToggleAdvanced={form.canToggleAdvanced}
          onToggleAdvanced={() => form.setAdvancedMode(!form.advancedMode)}
          onClose={onClose}
        />

        <form onSubmit={form.handleSubmit(form.onSubmit)} className="p-5 space-y-8">
          <ProductCatalogModalFormBody
            form={form}
            categories={categories}
            stores={stores}
            selectedStore={selectedStore}
            onCreateStoreChange={onCreateStoreChange}
            templateCode={templateCode}
            advancedMode={advancedMode}
            onCreateTemplateChange={onCreateTemplateChange}
          />

          <ProductCatalogModalFooter
            t={form.t}
            isEdit={form.isEdit}
            isPending={form.isPending}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
}

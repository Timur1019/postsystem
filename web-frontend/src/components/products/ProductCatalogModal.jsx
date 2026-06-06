import { ArrowLeft, Loader, X } from 'lucide-react';
import TasnifSearchPanel from './TasnifSearchPanel';
import { useProductCatalogForm } from '../../hooks/useProductCatalogForm';
import ProductCatalogGeneralSection from './catalog/ProductCatalogGeneralSection';
import ProductCatalogAccountingSection from './catalog/ProductCatalogAccountingSection';
import ProductCatalogStorePricesSection from './catalog/ProductCatalogStorePricesSection';
import ProductCatalogBarcodesSection from './catalog/ProductCatalogBarcodesSection';
import ProductCatalogRetailExtrasSection from './catalog/ProductCatalogRetailExtrasSection';
import ProductCatalogFiscalSection from './catalog/ProductCatalogFiscalSection';

export default function ProductCatalogModal({
  product,
  categories,
  stores,
  onClose,
  onSaved,
  templateCode = null,
  advancedMode = false,
  onBackToPicker,
}) {
  const form = useProductCatalogForm(product, stores, onSaved, { templateCode, advancedMode });
  const templateTitle =
    form.templateCode && !form.advancedMode
      ? form.t(`productTemplates.${form.templateCode}.title`)
      : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            {!form.isEdit && onBackToPicker ? (
              <button
                type="button"
                onClick={onBackToPicker}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                title={form.t('productTemplates.backToPicker')}
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {form.isEdit ? form.t('productCatalog.editTitle') : form.t('productCatalog.addTitle')}
              </h2>
              {templateTitle ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {form.t('productTemplates.formBadge', { template: templateTitle })}
                </p>
              ) : null}
              {form.advancedMode ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {form.t('productTemplates.advancedBadge')}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {form.canToggleAdvanced ? (
              <button
                type="button"
                onClick={() => form.setAdvancedMode(!form.advancedMode)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {form.advancedMode
                  ? form.t('productTemplates.showTemplateFields')
                  : form.t('productTemplates.showAllFields')}
              </button>
            ) : null}
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(form.onSubmit)} className="p-5 space-y-8">
          {form.showSection('tasnif') ? (
            <div className="space-y-4">
              <TasnifSearchPanel setValue={form.setValue} getValues={form.getValues} isEdit={form.isEdit} />
              <ProductCatalogFiscalSection
                t={form.t}
                register={form.register}
                errors={form.errors}
              />
            </div>
          ) : null}

          <ProductCatalogGeneralSection
            t={form.t}
            register={form.register}
            errors={form.errors}
            categories={categories}
            isEdit={form.isEdit}
            saleTypeWatch={form.saleTypeWatch}
            productTypeWatch={form.productTypeWatch}
            template={form.template}
            showSection={form.showSection}
          />

          <ProductCatalogAccountingSection
            t={form.t}
            register={form.register}
            errors={form.errors}
            template={form.template}
            showSection={form.showSection}
          />

          {form.showSection('storePrices') ? (
            <ProductCatalogStorePricesSection
              t={form.t}
              stores={stores}
              storeRows={form.storeRows}
              setStoreRows={form.setStoreRows}
              getValues={form.getValues}
              sellingPriceWatch={form.sellingPriceWatch}
            />
          ) : null}

          {form.showSection('clothing') || form.showSection('pharmacy') ? (
            <ProductCatalogRetailExtrasSection
              t={form.t}
              register={form.register}
              errors={form.errors}
              template={form.template}
              showSection={form.showSection}
            />
          ) : null}

          {form.showSection('barcodes') ? (
            <ProductCatalogBarcodesSection
              t={form.t}
              register={form.register}
              errors={form.errors}
              extraBarcodes={form.extraBarcodes}
              setExtraBarcodes={form.setExtraBarcodes}
            />
          ) : null}

          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-400/90">
            {form.t('productCatalog.requiredHint')}
          </p>

          <div className="flex gap-3 border-t border-slate-200 pt-2 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {form.t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={form.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {form.isPending && <Loader size={14} className="animate-spin" />}
              {form.isEdit ? form.t('productModal.saveChanges') : form.t('productCatalog.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

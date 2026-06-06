// src/components/products/ProductCatalogModal.jsx
import { Loader, X } from 'lucide-react';
import TasnifSearchPanel from './TasnifSearchPanel';
import { useProductCatalogForm } from '../../hooks/useProductCatalogForm';
import ProductCatalogGeneralSection from './catalog/ProductCatalogGeneralSection';
import ProductCatalogAccountingSection from './catalog/ProductCatalogAccountingSection';
import ProductCatalogStorePricesSection from './catalog/ProductCatalogStorePricesSection';
import ProductCatalogBarcodesSection from './catalog/ProductCatalogBarcodesSection';

export default function ProductCatalogModal({ product, categories, stores, onClose, onSaved }) {
  const form = useProductCatalogForm(product, stores, onSaved);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {form.isEdit ? form.t('productCatalog.editTitle') : form.t('productCatalog.addTitle')}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(form.onSubmit)} className="p-5 space-y-8">
          <TasnifSearchPanel setValue={form.setValue} getValues={form.getValues} isEdit={form.isEdit} />

          <ProductCatalogGeneralSection
            t={form.t}
            register={form.register}
            errors={form.errors}
            categories={categories}
            isEdit={form.isEdit}
            saleTypeWatch={form.saleTypeWatch}
            productTypeWatch={form.productTypeWatch}
          />

          <ProductCatalogAccountingSection t={form.t} register={form.register} errors={form.errors} />

          <ProductCatalogStorePricesSection
            t={form.t}
            stores={stores}
            storeRows={form.storeRows}
            setStoreRows={form.setStoreRows}
            getValues={form.getValues}
            sellingPriceWatch={form.sellingPriceWatch}
          />

          <ProductCatalogBarcodesSection
            t={form.t}
            register={form.register}
            errors={form.errors}
            extraBarcodes={form.extraBarcodes}
            setExtraBarcodes={form.setExtraBarcodes}
          />

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

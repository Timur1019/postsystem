import { inputCls, ProductCatalogField } from './productCatalogFormUi';

export default function ProductCatalogAccountingSection({ t, register, errors }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionAccounting')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ProductCatalogField label={t('productModal.cost')} error={errors.costPrice?.message}>
          <input {...register('costPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.price')} error={errors.sellingPrice?.message}>
          <input {...register('sellingPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productCatalog.defaultDiscount')} error={errors.defaultDiscountPercent?.message}>
          <input
            {...register('defaultDiscountPercent', { valueAsNumber: true })}
            type="number"
            min="0"
            max="100"
            step="0.1"
            className={inputCls}
          />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.lowStock')} error={errors.lowStockAlert?.message}>
          <input {...register('lowStockAlert', { valueAsNumber: true })} type="number" className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.initialStock')} error={errors.initialStock?.message}>
          <input {...register('initialStock', { valueAsNumber: true })} type="number" min="0" className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('stockModule.modal.location')} error={errors.storageLocation?.message}>
          <input
            {...register('storageLocation')}
            className={inputCls}
            placeholder={t('stockModule.modal.locationPh')}
          />
        </ProductCatalogField>
      </div>
      <ProductCatalogField label={t('productModal.description')} error={errors.description?.message}>
        <textarea {...register('description')} rows={2} className={`${inputCls} resize-none`} />
      </ProductCatalogField>
    </section>
  );
}

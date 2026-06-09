import { inputCls, ProductCatalogField } from './productCatalogFormUi';

export default function ProductCatalogFiscalSection({ t, register, errors }) {
  return (
    <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/40 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300">
        {t('productCatalog.sectionFiscal')}
      </h3>
      <p className="text-xs text-sky-700/90 dark:text-sky-400/90">{t('productCatalog.sectionFiscalHint')}</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ProductCatalogField label={t('productCatalog.externalId')} error={errors.externalProductId?.message}>
          <input {...register('externalProductId')} className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productCatalog.ikpu')} error={errors.ikpu?.message}>
          <input {...register('ikpu')} className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productCatalog.unitCode')} error={errors.unitMeasureCode?.message}>
          <input {...register('unitMeasureCode')} placeholder="1–999" className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productCatalog.packageCode')} error={errors.packageCode?.message}>
          <input {...register('packageCode')} placeholder="1–9999999" className={inputCls} />
        </ProductCatalogField>
      </div>
    </section>
  );
}

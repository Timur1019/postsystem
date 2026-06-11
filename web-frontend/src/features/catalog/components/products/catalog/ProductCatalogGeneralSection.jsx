import { BaseSelect } from '../../../../../components/ui';
import { templateShowsConstructionField } from '../../../../../config/productCatalogTemplateRegistry';
import { stockUnitsForSaleType } from '../../../../../utils/unitConfig';
import {
  inputCls,
  OWNER_TYPES,
  ProductCatalogField,
  VAT_OPTIONS,
} from './productCatalogFormUi';

export default function ProductCatalogGeneralSection({
  t,
  register,
  errors,
  categories,
  isEdit,
  saleTypeWatch,
  productTypeWatch,
  template,
  universalMode = false,
  showSection,
}) {
  const showTypeSelectors = showSection('typeSelectors');
  const showAdvancedUnits = showSection('advancedUnits');
  const showConstruction =
    showSection('construction') &&
    (universalMode ||
      (template
        ? (template.constructionFields?.length ?? 0) > 0
        : productTypeWatch === 'MATERIAL'));
  const showRetailFlags =
    showSection('retailFlags') && (universalMode || productTypeWatch === 'RETAIL');
  const showOwnerVat = showSection('ownerVat');
  const unitOptions = stockUnitsForSaleType(saleTypeWatch);

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionGeneral')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ProductCatalogField label={t('productModal.sku')} required error={errors.sku?.message}>
          <input {...register('sku')} disabled={isEdit} className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.name')} required error={errors.name?.message}>
          <input {...register('name')} className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.category')} error={errors.categoryId?.message}>
          <BaseSelect
            {...register('categoryId')}
            placeholder={t('productModal.noneCategory')}
            options={[
              { value: '', label: t('productModal.noneCategory') },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
        </ProductCatalogField>
        {showTypeSelectors ? (
          <>
            {universalMode || isEdit ? (
              <ProductCatalogField label={t('productCatalog.productType')} required error={errors.productType?.message}>
                <BaseSelect
                  {...register('productType')}
                  options={[
                    { value: 'RETAIL', label: t('productCatalog.productTypeRetail') },
                    { value: 'MATERIAL', label: t('productCatalog.productTypeMaterial') },
                    { value: 'DISH', label: t('productCatalog.productTypeDish') },
                    { value: 'SERVICE', label: t('productCatalog.productTypeService') },
                  ]}
                />
              </ProductCatalogField>
            ) : null}
            <ProductCatalogField label={t('productCatalog.saleType')} required error={errors.saleType?.message}>
              <BaseSelect
                {...register('saleType')}
                options={[
                  { value: 'PIECE', label: t('productCatalog.saleTypePiece') },
                  { value: 'WEIGHT', label: t('productCatalog.saleTypeWeight') },
                  { value: 'SERVICE', label: t('productCatalog.saleTypeService') },
                ]}
              />
            </ProductCatalogField>
            <ProductCatalogField label={t('productCatalog.unitCode')} required error={errors.unitCode?.message}>
              <BaseSelect
                {...register('unitCode')}
                options={unitOptions.map((u) => ({
                  value: u.code,
                  label: u.labelRu ? `${u.label} — ${u.labelRu}` : u.label,
                }))}
              />
            </ProductCatalogField>
          </>
        ) : null}
        {showAdvancedUnits ? (
          <>
            <ProductCatalogField label={t('productCatalog.quantityScale')} error={errors.quantityScale?.message}>
              <BaseSelect
                {...register('quantityScale')}
                options={[
                  { value: '0', label: '0' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                ]}
              />
            </ProductCatalogField>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
              <input type="checkbox" {...register('allowFraction')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.allowFraction')}
            </label>
            <ProductCatalogField label={t('productCatalog.unit')} required error={errors.unitOfMeasure?.message}>
              <input {...register('unitOfMeasure')} className={inputCls} />
            </ProductCatalogField>
            {!showSection('tasnif') ? (
              <>
                <ProductCatalogField label={t('productCatalog.unitCode')} error={errors.unitMeasureCode?.message}>
                  <input {...register('unitMeasureCode')} placeholder="1–999" className={inputCls} />
                </ProductCatalogField>
                <ProductCatalogField label={t('productCatalog.packageCode')} error={errors.packageCode?.message}>
                  <input {...register('packageCode')} placeholder="1–9999999" className={inputCls} />
                </ProductCatalogField>
              </>
            ) : null}
          </>
        ) : null}
      </div>
      {showConstruction ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            {t('productCatalog.sectionConstruction')}
          </p>
          {templateShowsConstructionField(template, 'standardLength') || !template ? (
            <ProductCatalogField label={t('productCatalog.constructionStandardLength')} error={errors.constructionStandardLength?.message}>
              <input type="number" step="0.01" {...register('constructionStandardLength')} className={inputCls} />
            </ProductCatalogField>
          ) : null}
          {templateShowsConstructionField(template, 'width') || !template ? (
            <ProductCatalogField label={t('productCatalog.constructionWidth')} error={errors.constructionWidth?.message}>
              <input type="number" step="0.01" {...register('constructionWidth')} className={inputCls} />
            </ProductCatalogField>
          ) : null}
          {templateShowsConstructionField(template, 'thickness') || !template ? (
            <ProductCatalogField label={t('productCatalog.constructionThickness')} error={errors.constructionThickness?.message}>
              <input type="number" step="0.01" {...register('constructionThickness')} className={inputCls} />
            </ProductCatalogField>
          ) : null}
          {templateShowsConstructionField(template, 'allowCutting') || !template ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
              <input type="checkbox" {...register('constructionAllowCutting')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.constructionAllowCutting')}
            </label>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-6">
        {showRetailFlags ? (
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" {...register('soldIndividually')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.soldByPiece')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" {...register('markedProduct')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.marked')}
            </label>
          </>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" {...register('active')} className="rounded border-slate-400 dark:border-slate-600" />
          {t('productCatalog.active')}
        </label>
      </div>
      {showOwnerVat ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ProductCatalogField label={t('productCatalog.ownerType')} required error={errors.ownerType?.message}>
            <BaseSelect
              {...register('ownerType')}
              options={OWNER_TYPES.map((o) => ({
                value: o,
                label: t(`productCatalog.owner.${o}`, o),
              }))}
            />
          </ProductCatalogField>
          <ProductCatalogField label={t('productCatalog.vat')} error={errors.taxRate?.message}>
            <BaseSelect
              {...register('taxRate', { valueAsNumber: true })}
              options={VAT_OPTIONS.map((v) => ({
                value: String(v),
                label: `${v}%`,
              }))}
            />
          </ProductCatalogField>
          <ProductCatalogField label={t('productCatalog.commissionTin')} error={errors.commissionTin?.message}>
            <input {...register('commissionTin')} maxLength={9} className={inputCls} />
          </ProductCatalogField>
          <ProductCatalogField label={t('productCatalog.commissionPinfl')} error={errors.commissionPinfl?.message}>
            <input {...register('commissionPinfl')} maxLength={14} className={inputCls} />
          </ProductCatalogField>
        </div>
      ) : null}
    </section>
  );
}

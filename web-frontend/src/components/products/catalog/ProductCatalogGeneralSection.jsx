import { templateShowsConstructionField } from '../../../config/productCatalogTemplateRegistry';
import { stockUnitsForSaleType } from '../../../utils/unitConfig';
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
  showSection,
}) {
  const showTypeSelectors = showSection('typeSelectors');
  const showAdvancedUnits = showSection('advancedUnits');
  const showConstruction =
    showSection('construction') &&
    (template
      ? (template.constructionFields?.length ?? 0) > 0
      : productTypeWatch === 'MATERIAL');
  const showRetailFlags = showSection('retailFlags') && productTypeWatch === 'RETAIL';
  const showOwnerVat = showSection('ownerVat');
  const unitOptions = stockUnitsForSaleType(saleTypeWatch);

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionGeneral')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {showSection('tasnif') ? (
          <>
            <ProductCatalogField label={t('productCatalog.externalId')} error={errors.externalProductId?.message}>
              <input {...register('externalProductId')} className={inputCls} />
            </ProductCatalogField>
            <ProductCatalogField label={t('productCatalog.ikpu')} error={errors.ikpu?.message}>
              <input {...register('ikpu')} className={inputCls} />
            </ProductCatalogField>
          </>
        ) : null}
        <ProductCatalogField label={t('productModal.sku')} required error={errors.sku?.message}>
          <input {...register('sku')} disabled={isEdit} className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.name')} required error={errors.name?.message}>
          <input {...register('name')} className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.category')} error={errors.categoryId?.message}>
          <select {...register('categoryId')} className={inputCls}>
            <option value="">{t('productModal.noneCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </ProductCatalogField>
        {showTypeSelectors ? (
          <>
            <ProductCatalogField label={t('productCatalog.productType')} required error={errors.productType?.message}>
              <select {...register('productType')} className={inputCls}>
                <option value="RETAIL">{t('productCatalog.productTypeRetail')}</option>
                <option value="MATERIAL">{t('productCatalog.productTypeMaterial')}</option>
                <option value="DISH">{t('productCatalog.productTypeDish')}</option>
                <option value="SERVICE">{t('productCatalog.productTypeService')}</option>
              </select>
            </ProductCatalogField>
            <ProductCatalogField label={t('productCatalog.saleType')} required error={errors.saleType?.message}>
              <select {...register('saleType')} className={inputCls}>
                <option value="PIECE">{t('productCatalog.saleTypePiece')}</option>
                <option value="WEIGHT">{t('productCatalog.saleTypeWeight')}</option>
                <option value="SERVICE">{t('productCatalog.saleTypeService')}</option>
              </select>
            </ProductCatalogField>
            <ProductCatalogField label={t('productCatalog.unitCode')} required error={errors.unitCode?.message}>
              <select {...register('unitCode')} className={inputCls}>
                {unitOptions.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.labelRu ? `${u.label} — ${u.labelRu}` : u.label}
                  </option>
                ))}
              </select>
            </ProductCatalogField>
          </>
        ) : null}
        {showAdvancedUnits ? (
          <>
            <ProductCatalogField label={t('productCatalog.quantityScale')} error={errors.quantityScale?.message}>
              <select {...register('quantityScale')} className={inputCls}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </ProductCatalogField>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
              <input type="checkbox" {...register('allowFraction')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.allowFraction')}
            </label>
            <ProductCatalogField label={t('productCatalog.unit')} required error={errors.unitOfMeasure?.message}>
              <input {...register('unitOfMeasure')} className={inputCls} />
            </ProductCatalogField>
            <ProductCatalogField label={t('productCatalog.unitCode')} error={errors.unitMeasureCode?.message}>
              <input {...register('unitMeasureCode')} placeholder="1–999" className={inputCls} />
            </ProductCatalogField>
            <ProductCatalogField label={t('productCatalog.packageCode')} error={errors.packageCode?.message}>
              <input {...register('packageCode')} placeholder="1–9999999" className={inputCls} />
            </ProductCatalogField>
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
            <select {...register('ownerType')} className={inputCls}>
              {OWNER_TYPES.map((o) => (
                <option key={o} value={o}>
                  {t(`productCatalog.owner.${o}`, o)}
                </option>
              ))}
            </select>
          </ProductCatalogField>
          <ProductCatalogField label={t('productCatalog.vat')} error={errors.taxRate?.message}>
            <select {...register('taxRate', { valueAsNumber: true })} className={inputCls}>
              {VAT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
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

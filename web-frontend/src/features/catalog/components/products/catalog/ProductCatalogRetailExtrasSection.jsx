import {
  templateShowsClothingField,
  templateShowsPharmacyField,
} from '../../../../../config/productCatalogTemplateRegistry';
import { inputCls, ProductCatalogField } from './productCatalogFormUi';

const GENDER_OPTIONS = ['UNISEX', 'MALE', 'FEMALE', 'KIDS'];

export default function ProductCatalogRetailExtrasSection({
  t,
  register,
  errors,
  template,
  showSection,
}) {
  const showClothing = showSection('clothing');
  const showPharmacy = showSection('pharmacy');
  if (!showClothing && !showPharmacy) return null;

  return (
    <section className="space-y-4">
      {showClothing ? (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/50 dark:bg-violet-950/20 md:grid-cols-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300 md:col-span-2">
            {t('productCatalog.sectionClothing')}
          </p>
          {templateShowsClothingField(template, 'sizeRange') || !template ? (
            <ProductCatalogField label={t('productCatalog.clothingSizeRange')} error={errors.clothingSizeRange?.message}>
              <input {...register('clothingSizeRange')} placeholder="S–XXL, 38–44" className={inputCls} />
            </ProductCatalogField>
          ) : null}
          {templateShowsClothingField(template, 'color') || !template ? (
            <ProductCatalogField label={t('productCatalog.clothingColor')} error={errors.clothingColor?.message}>
              <input {...register('clothingColor')} className={inputCls} />
            </ProductCatalogField>
          ) : null}
          {templateShowsClothingField(template, 'gender') || !template ? (
            <ProductCatalogField label={t('productCatalog.clothingGender')} error={errors.clothingGender?.message}>
              <select {...register('clothingGender')} className={inputCls}>
                <option value="">{t('productModal.noneCategory')}</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {t(`productCatalog.clothingGender.${g}`)}
                  </option>
                ))}
              </select>
            </ProductCatalogField>
          ) : null}
        </div>
      ) : null}

      {showPharmacy ? (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-900/50 dark:bg-sky-950/20 md:grid-cols-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300 md:col-span-2">
            {t('productCatalog.sectionPharmacy')}
          </p>
          {templateShowsPharmacyField(template, 'dosageForm') || !template ? (
            <ProductCatalogField label={t('productCatalog.pharmacyDosageForm')} error={errors.pharmacyDosageForm?.message}>
              <input {...register('pharmacyDosageForm')} placeholder={t('productCatalog.pharmacyDosageFormPh')} className={inputCls} />
            </ProductCatalogField>
          ) : null}
          {templateShowsPharmacyField(template, 'expiryRequired') || !template ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
              <input type="checkbox" {...register('pharmacyExpiryRequired')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.pharmacyExpiryRequired')}
            </label>
          ) : null}
          {templateShowsPharmacyField(template, 'prescriptionRequired') || !template ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
              <input type="checkbox" {...register('pharmacyPrescriptionRequired')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.pharmacyPrescriptionRequired')}
            </label>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

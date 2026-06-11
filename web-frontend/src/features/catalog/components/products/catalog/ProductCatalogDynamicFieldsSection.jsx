import { BaseSelect } from '../../../../../components/ui';
import { inputCls, ProductCatalogField } from './productCatalogFormUi';

function fieldName(key) {
  return `attr_${key}`;
}

export default function ProductCatalogDynamicFieldsSection({
  t,
  register,
  errors,
  fields = [],
  loading = false,
}) {
  const enabledFields = fields.filter((f) => f.enabled !== false);
  if (loading) {
    return (
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
          {t('productCatalog.sectionBusinessFields')}
        </h3>
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </section>
    );
  }
  if (enabledFields.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">
        {t('productCatalog.sectionBusinessFields')}
      </h3>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20 md:grid-cols-2">
        {enabledFields.map((field) => {
          const name = fieldName(field.fieldKey);
          const error = errors[name]?.message;
          const rules = field.required ? { required: t('validation.fieldRequired', { field: field.label }) } : {};

          if (field.fieldType === 'BOOLEAN') {
            return (
              <label
                key={field.id ?? field.fieldKey}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2"
              >
                <input type="checkbox" {...register(name, rules)} className="rounded border-slate-400 dark:border-slate-600" />
                {field.label}
                {field.required ? <span className="text-red-500">*</span> : null}
              </label>
            );
          }

          if (field.fieldType === 'LIST') {
            return (
              <ProductCatalogField key={field.id ?? field.fieldKey} label={field.label} required={field.required} error={error}>
                <BaseSelect
                  {...register(name, rules)}
                  placeholder={t('productModal.noneCategory')}
                  options={[
                    { value: '', label: t('productModal.noneCategory') },
                    ...(field.options ?? []).map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    })),
                  ]}
                />
              </ProductCatalogField>
            );
          }

          const inputType =
            field.fieldType === 'NUMBER' || field.fieldType === 'PRICE'
              ? 'number'
              : field.fieldType === 'DATE'
                ? 'date'
                : 'text';

          return (
            <ProductCatalogField key={field.id ?? field.fieldKey} label={field.label} required={field.required} error={error}>
              <input
                type={inputType}
                step={field.fieldType === 'PRICE' || field.fieldType === 'NUMBER' ? 'any' : undefined}
                placeholder={field.placeholder ?? ''}
                {...register(name, rules)}
                className={inputCls}
              />
              {field.hint ? <p className="mt-1 text-xs text-slate-500">{field.hint}</p> : null}
            </ProductCatalogField>
          );
        })}
      </div>
    </section>
  );
}

export { fieldName as businessAttributeFieldName };

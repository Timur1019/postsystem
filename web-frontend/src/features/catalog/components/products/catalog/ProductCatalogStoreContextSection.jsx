import { Store } from 'lucide-react';
import { BaseSelect } from '../../../../../components/ui';
import {
  isUniversalStoreType,
  listTemplatesForBusinessType,
  resolveBusinessTypeForTemplates,
} from '../../../../../config/productCatalogTemplateRegistry';

const ADVANCED_TEMPLATE_VALUE = '__advanced__';

export default function ProductCatalogStoreContextSection({
  t,
  stores,
  selectedStore,
  onStoreChange,
  universalMode = false,
  templateCode = null,
  advancedMode = false,
  onTemplateChange,
}) {
  const businessType = resolveBusinessTypeForTemplates(selectedStore?.businessType);
  const templates = listTemplatesForBusinessType(selectedStore?.businessType);
  const showTemplateSelect = !universalMode && !isUniversalStoreType(selectedStore?.businessType);
  const templateValue = advancedMode ? ADVANCED_TEMPLATE_VALUE : (templateCode ?? '');

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <div className="mb-3 flex items-center gap-2">
        <Store size={16} className="text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {t('productCatalog.sectionStore')}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <BaseSelect
            label={t('productCatalog.store')}
            value={selectedStore?.id ?? ''}
            onChange={(e) => {
              const store = stores.find((s) => String(s.id) === e.target.value);
              if (store) onStoreChange(store);
            }}
            options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600 dark:text-slate-500">
            {t('stores.colBusinessType')}
          </label>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {t(`productTemplates.businessTypes.${businessType}`)}
          </p>
        </div>
        {showTemplateSelect ? (
          <div className="sm:col-span-2">
            <BaseSelect
              label={t('productTemplates.templateLabel')}
              value={templateValue}
              onChange={(e) => onTemplateChange?.(e.target.value)}
              placeholder={t('productTemplates.templatePlaceholder')}
              options={[
                { value: '', label: t('productTemplates.templatePlaceholder'), disabled: true },
                ...templates.map((tpl) => ({
                  value: tpl.code,
                  label: t(`productTemplates.${tpl.code}.title`),
                })),
                { value: ADVANCED_TEMPLATE_VALUE, label: t('productTemplates.advancedForm') },
              ]}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

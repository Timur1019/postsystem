import { Store } from 'lucide-react';
import {
  isUniversalStoreType,
  listTemplatesForBusinessType,
  resolveBusinessTypeForTemplates,
} from '../../../config/productCatalogTemplateRegistry';
import { inputCls } from './productCatalogFormUi';

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
          <label className="mb-1 block text-xs text-slate-600 dark:text-slate-500">
            {t('productCatalog.store')}
          </label>
          <select
            className={inputCls}
            value={selectedStore?.id ?? ''}
            onChange={(e) => {
              const store = stores.find((s) => String(s.id) === e.target.value);
              if (store) onStoreChange(store);
            }}
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-500">
              {t('productTemplates.templateLabel')}
            </label>
            <select
              className={inputCls}
              value={templateValue}
              onChange={(e) => onTemplateChange?.(e.target.value)}
            >
              <option value="" disabled>
                {t('productTemplates.templatePlaceholder')}
              </option>
              {templates.map((tpl) => (
                <option key={tpl.code} value={tpl.code}>
                  {t(`productTemplates.${tpl.code}.title`)}
                </option>
              ))}
              <option value={ADVANCED_TEMPLATE_VALUE}>
                {t('productTemplates.advancedForm')}
              </option>
            </select>
          </div>
        ) : null}
      </div>
    </section>
  );
}

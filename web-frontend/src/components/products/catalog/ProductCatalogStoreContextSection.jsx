import { Store } from 'lucide-react';
import { resolveBusinessTypeForTemplates } from '../../../config/productCatalogTemplateRegistry';
import { inputCls } from './productCatalogFormUi';

export default function ProductCatalogStoreContextSection({
  t,
  stores,
  selectedStore,
  onStoreChange,
}) {
  const businessType = resolveBusinessTypeForTemplates(selectedStore?.businessType);

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
      </div>
    </section>
  );
}

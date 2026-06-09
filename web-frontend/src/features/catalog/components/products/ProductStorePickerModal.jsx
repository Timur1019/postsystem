import { Store, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveBusinessTypeForTemplates } from '../../../../config/productCatalogTemplateRegistry';

export default function ProductStorePickerModal({ stores, onClose, onSelectStore }) {
  const { t } = useTranslation();
  const activeStores = (stores ?? []).filter((s) => s.active !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('productTemplates.storePickerTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t('productTemplates.storePickerSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 p-5">
          {activeStores.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {t('productTemplates.noStoresHint')}
            </p>
          ) : (
            activeStores.map((store) => {
              const businessType = resolveBusinessTypeForTemplates(store.businessType);
              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => onSelectStore(store)}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-emerald-600"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Store size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900 dark:text-white">{store.name}</span>
                    {store.address ? (
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                        {store.address}
                      </span>
                    ) : null}
                    <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {t(`productTemplates.businessTypes.${businessType}`)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

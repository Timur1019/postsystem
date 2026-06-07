import { ArrowLeft, Settings2, Store, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_TYPES,
  listTemplatesForBusinessType,
  resolveBusinessTypeForTemplates,
} from '../../config/productCatalogTemplateRegistry';

export default function ProductTemplatePickerModal({
  selectedStore,
  onClose,
  onBackToStores,
  onSelectTemplate,
  onAdvanced,
}) {
  const { t } = useTranslation();
  const businessType = resolveBusinessTypeForTemplates(selectedStore?.businessType);
  const templates = listTemplatesForBusinessType(businessType);
  const businessMeta = BUSINESS_TYPES.find((bt) => bt.code === businessType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            {onBackToStores ? (
              <button
                type="button"
                onClick={onBackToStores}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                title={t('productTemplates.backToStores')}
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('productTemplates.pickerTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('productTemplates.pickerSubtitleStore')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div className="flex items-start gap-3">
              <Store size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedStore?.name}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {t('productTemplates.storeTypeHint', {
                    type: t(`productTemplates.businessTypes.${businessType}`),
                  })}
                </p>
                {businessMeta ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    {t('productTemplates.templateCountHint', { count: templates.length })}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {templates.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.code}
                  type="button"
                  onClick={() => onSelectTemplate(tpl.code)}
                  className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-emerald-600"
                >
                  <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Icon size={20} />
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {t(`productTemplates.${tpl.code}.title`)}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(`productTemplates.${tpl.code}.hint`)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onAdvanced}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings2 size={16} />
            {t('productTemplates.advancedForm')}
          </button>
        </div>
      </div>
    </div>
  );
}

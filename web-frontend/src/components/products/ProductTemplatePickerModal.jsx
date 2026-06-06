import { X, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_TYPES,
  listTemplatesForBusinessType,
} from '../../config/productCatalogTemplateRegistry';
import { useCompanyBusinessType } from '../../hooks/useCompanyBusinessType';

export default function ProductTemplatePickerModal({
  onClose,
  onSelectTemplate,
  onAdvanced,
}) {
  const { t } = useTranslation();
  const { businessType, setBusinessType, isLoading, isSaving } = useCompanyBusinessType();

  const templates = listTemplatesForBusinessType(businessType);

  const handleBusinessTypeChange = (code) => {
    setBusinessType(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('productTemplates.pickerTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t('productTemplates.pickerSubtitle')}
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

        <div className="space-y-6 p-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('productTemplates.businessTypeLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map((bt) => {
                const Icon = bt.icon;
                const active = businessType === bt.code;
                const disabled = isLoading || isSaving;
                return (
                  <button
                    key={bt.code}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleBusinessTypeChange(bt.code)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Icon size={14} />
                    {t(`productTemplates.businessTypes.${bt.code}`)}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('productTemplates.businessTypeHint')}
            </p>
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

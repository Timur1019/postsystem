import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { BUSINESS_TYPES } from '../../config/productCatalogTemplateRegistry';
import { useCompanyBusinessType } from '../../hooks/useCompanyBusinessType';

export default function CompanyBusinessTypeSettingsPanel() {
  const { t } = useTranslation();
  const { businessType, setBusinessType, isLoading, isSaving } = useCompanyBusinessType();

  const handleSelect = (code) => {
    if (code === businessType || isSaving) return;
    setBusinessType(code, {
      onSuccess: () => toast.success(t('tenantSettings.businessTypeSaved')),
      onError: (err) => toast.error(err.response?.data?.message ?? t('tenantSettings.businessTypeSaveFailed')),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-3 flex items-center gap-2">
        <Building2 size={16} className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {t('tenantSettings.businessTypeTitle')}
        </p>
      </div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {t('tenantSettings.businessTypeHint')}
      </p>
      <div className="flex flex-wrap gap-2">
        {BUSINESS_TYPES.map((bt) => {
          const Icon = bt.icon;
          const active = businessType === bt.code;
          return (
            <button
              key={bt.code}
              type="button"
              disabled={isLoading || isSaving}
              onClick={() => handleSelect(bt.code)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
                active
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              <Icon size={14} />
              {t(`productTemplates.businessTypes.${bt.code}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

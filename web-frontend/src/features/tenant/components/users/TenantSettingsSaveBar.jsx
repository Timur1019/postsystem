import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useTenantDisplayStore } from '../../../../store/tenantDisplayStore';

export default function TenantSettingsSaveBar() {
  const { t } = useTranslation();
  const isDirty = useTenantDisplayStore((s) => s.isDirty);
  const isSaving = useTenantDisplayStore((s) => s.isSaving);
  const isLoading = useTenantDisplayStore((s) => s.isLoading);
  const saveToServer = useTenantDisplayStore((s) => s.saveToServer);
  const discardDraft = useTenantDisplayStore((s) => s.discardDraft);

  const handleSave = async () => {
    try {
      await saveToServer();
      toast.success(t('tenantSettings.saved'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('tenantSettings.saveFailed'));
    }
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isDirty ? (
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={discardDraft}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('tenantSettings.discard')}
          </button>
        ) : null}
        <button
          type="button"
          disabled={isSaving || isLoading || !isDirty}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} aria-hidden />
          {isSaving ? t('tenantSettings.saving') : t('tenantSettings.save')}
        </button>
      </div>
      <p className="mt-2 text-right text-xs text-slate-500 dark:text-slate-400">
        {t('tenantSettings.saveHint')}
      </p>
    </div>
  );
}

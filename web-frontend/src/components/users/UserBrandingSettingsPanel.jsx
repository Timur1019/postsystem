import { useTranslation } from 'react-i18next';
import { UserCog } from 'lucide-react';
import { APP_NAME } from '../../config/brand';
import {
  USER_FORM_FIELD_DEFS,
  useTenantDisplayStore,
} from '../../store/tenantDisplayStore';
import LogoUploadField from './LogoUploadField';
import SettingsFieldToggles from './SettingsFieldToggles';
import BrandMark from '../shared/BrandMark';

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export default function UserBrandingSettingsPanel() {
  const { t } = useTranslation();
  const systemLogoDataUrl = useTenantDisplayStore((s) => s.systemLogoDataUrl);
  const systemAppName = useTenantDisplayStore((s) => s.systemAppName);
  const userFormFields = useTenantDisplayStore((s) => s.userFormFields);
  const setSystemLogo = useTenantDisplayStore((s) => s.setSystemLogo);
  const clearSystemLogo = useTenantDisplayStore((s) => s.clearSystemLogo);
  const setSystemAppName = useTenantDisplayStore((s) => s.setSystemAppName);
  const setUserFormField = useTenantDisplayStore((s) => s.setUserFormField);
  const resetUserFormFields = useTenantDisplayStore((s) => s.resetUserFormFields);
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <UserCog size={18} className="text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t('tenantSettings.userTitle')}
        </h2>
      </div>
      <div className="space-y-5 p-4">
        <LogoUploadField
          label={t('tenantSettings.systemLogo')}
          hint={t('tenantSettings.systemLogoHint')}
          dataUrl={systemLogoDataUrl}
          onSet={setSystemLogo}
          onClear={clearSystemLogo}
          previewSize={72}
        />

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
            <BrandMark size={28} iconClassName="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('tenantSettings.preview')}</p>
            <p className="truncate font-semibold text-slate-900 dark:text-white">{displayAppName()}</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('tenantSettings.systemAppName')}
          </label>
          <input
            className={inputCls}
            value={systemAppName}
            onChange={(e) => setSystemAppName(e.target.value)}
            placeholder={APP_NAME}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('tenantSettings.systemAppNameHint')}</p>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('tenantSettings.userFieldsTitle')}
            </p>
            <button
              type="button"
              onClick={resetUserFormFields}
              className="text-xs text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              {t('tenantSettings.resetFields')}
            </button>
          </div>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{t('tenantSettings.userFieldsHint')}</p>
          <SettingsFieldToggles
            defs={USER_FORM_FIELD_DEFS}
            values={userFormFields}
            onChange={setUserFormField}
            labelFor={(key) => t(key)}
          />
        </div>
      </div>
    </section>
  );
}

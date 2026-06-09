import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCog } from 'lucide-react';
import { APP_NAME } from '../../../../config/brand';
import {
  USER_FORM_FIELD_DEFS,
  useTenantDisplayStore,
  SYSTEM_LOGO_SIZE_MIN_PX,
  SYSTEM_LOGO_SIZE_MAX_PX,
} from '../../../../store/tenantDisplayStore';
import LogoUploadField from './LogoUploadField';
import ReceiptLogoSizeControl from './ReceiptLogoSizeControl';
import SettingsFieldToggles from './SettingsFieldToggles';
import BrandMark from '../../../../components/shared/BrandMark';
import TenantSettingsSaveBar from './TenantSettingsSaveBar';

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export default function UserBrandingSettingsPanel() {
  const { t } = useTranslation();
  const fetchFromServer = useTenantDisplayStore((s) => s.fetchFromServer);
  const systemLogoDataUrl = useTenantDisplayStore((s) => s.draft.systemLogoDataUrl);
  const systemLogoSizePx = useTenantDisplayStore((s) => s.draft.systemLogoSizePx);
  const systemAppName = useTenantDisplayStore((s) => s.draft.systemAppName);
  const receiptLogoDataUrl = useTenantDisplayStore((s) => s.draft.receiptLogoDataUrl);
  const receiptLogoMaxHeightMm = useTenantDisplayStore((s) => s.draft.receiptLogoMaxHeightMm);
  const userFormFields = useTenantDisplayStore((s) => s.draft.userFormFields);
  const setSystemLogo = useTenantDisplayStore((s) => s.setSystemLogo);
  const clearSystemLogo = useTenantDisplayStore((s) => s.clearSystemLogo);
  const setSystemLogoSizePx = useTenantDisplayStore((s) => s.setSystemLogoSizePx);
  const setReceiptLogo = useTenantDisplayStore((s) => s.setReceiptLogo);
  const clearReceiptLogo = useTenantDisplayStore((s) => s.clearReceiptLogo);
  const setReceiptLogoMaxHeightMm = useTenantDisplayStore((s) => s.setReceiptLogoMaxHeightMm);
  const setSystemAppName = useTenantDisplayStore((s) => s.setSystemAppName);
  const setUserFormField = useTenantDisplayStore((s) => s.setUserFormField);
  const resetUserFormFields = useTenantDisplayStore((s) => s.resetUserFormFields);

  const previewAppName = systemAppName.trim() || APP_NAME;

  useEffect(() => {
    fetchFromServer();
  }, [fetchFromServer]);

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
          previewSize={Math.min(96, systemLogoSizePx)}
        />

        {systemLogoDataUrl ? (
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('tenantSettings.systemLogoSize')}
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="range"
                min={SYSTEM_LOGO_SIZE_MIN_PX}
                max={SYSTEM_LOGO_SIZE_MAX_PX}
                step={2}
                value={systemLogoSizePx}
                onChange={(e) => setSystemLogoSizePx(e.target.value)}
                className="min-w-[10rem] flex-1"
              />
              <span className="text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">
                {systemLogoSizePx} {t('tenantSettings.systemLogoSizeUnit')}
              </span>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50">
                <BrandMark size={systemLogoSizePx} />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('tenantSettings.systemLogoSizeHint')}
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
            <BrandMark size={28} iconClassName="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('tenantSettings.preview')}</p>
            <p className="truncate font-semibold text-slate-900 dark:text-white">{previewAppName}</p>
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

        <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('tenantSettings.brandingReceiptSection')}
          </p>
          <div className="space-y-4">
            <LogoUploadField
              label={t('tenantSettings.receiptLogo')}
              hint={t('tenantSettings.receiptLogoHint')}
              dataUrl={receiptLogoDataUrl}
              onSet={setReceiptLogo}
              onClear={clearReceiptLogo}
              previewSize={72}
            />
            <ReceiptLogoSizeControl
              mm={receiptLogoMaxHeightMm}
              onChange={setReceiptLogoMaxHeightMm}
              previewDataUrl={receiptLogoDataUrl}
            />
          </div>
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

        <TenantSettingsSaveBar />
      </div>
    </section>
  );
}

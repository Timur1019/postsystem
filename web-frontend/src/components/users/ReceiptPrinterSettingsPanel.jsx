import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import ThermalPrintSettingsPanel from '../receipt/ThermalPrintSettingsPanel';
import {
  RECEIPT_FIELD_DEFS,
  useTenantDisplayStore,
} from '../../store/tenantDisplayStore';
import {
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../../utils/syncReceiptDisplayCssVars';
import LogoUploadField from './LogoUploadField';
import SettingsFieldToggles from './SettingsFieldToggles';

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export default function ReceiptPrinterSettingsPanel() {
  const { t } = useTranslation();
  const receiptLogoDataUrl = useTenantDisplayStore((s) => s.receiptLogoDataUrl);
  const receiptLogoMaxHeightMm = useTenantDisplayStore((s) => s.receiptLogoMaxHeightMm);
  const setReceiptLogoMaxHeightMm = useTenantDisplayStore((s) => s.setReceiptLogoMaxHeightMm);
  const receiptCompanyName = useTenantDisplayStore((s) => s.receiptCompanyName);
  const receiptCompanyAddress = useTenantDisplayStore((s) => s.receiptCompanyAddress);
  const receiptStir = useTenantDisplayStore((s) => s.receiptStir);
  const receiptFields = useTenantDisplayStore((s) => s.receiptFields);
  const setReceiptLogo = useTenantDisplayStore((s) => s.setReceiptLogo);
  const clearReceiptLogo = useTenantDisplayStore((s) => s.clearReceiptLogo);
  const setReceiptCompanyName = useTenantDisplayStore((s) => s.setReceiptCompanyName);
  const setReceiptCompanyAddress = useTenantDisplayStore((s) => s.setReceiptCompanyAddress);
  const setReceiptStir = useTenantDisplayStore((s) => s.setReceiptStir);
  const setReceiptField = useTenantDisplayStore((s) => s.setReceiptField);
  const resetReceiptFields = useTenantDisplayStore((s) => s.resetReceiptFields);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Printer size={18} className="text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t('tenantSettings.printerTitle')}
        </h2>
      </div>
      <div className="space-y-5 p-4">
        <LogoUploadField
          label={t('tenantSettings.receiptLogo')}
          hint={t('tenantSettings.receiptLogoHint')}
          dataUrl={receiptLogoDataUrl}
          onSet={setReceiptLogo}
          onClear={clearReceiptLogo}
          previewSize={72}
        />

        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('tenantSettings.receiptLogoMaxHeight')}
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              type="range"
              min={RECEIPT_LOGO_HEIGHT_MIN_MM}
              max={RECEIPT_LOGO_HEIGHT_MAX_MM}
              step={1}
              value={receiptLogoMaxHeightMm}
              onChange={(e) => setReceiptLogoMaxHeightMm(e.target.value)}
              className="min-w-[10rem] flex-1"
            />
            <span className="text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">
              {receiptLogoMaxHeightMm} {t('tenantSettings.receiptLogoMaxHeightUnit')}
            </span>
            {receiptLogoDataUrl ? (
              <div
                className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white px-2 dark:border-slate-600 dark:bg-slate-800"
                style={{ width: 120, height: Math.min(96, receiptLogoMaxHeightMm * 2.2) }}
              >
                <img
                  src={receiptLogoDataUrl}
                  alt=""
                  className="receipt-logo max-w-full object-contain"
                  style={{ maxHeight: `${receiptLogoMaxHeightMm}mm` }}
                />
              </div>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('tenantSettings.receiptLogoMaxHeightHint')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('tenantSettings.receiptCompanyName')}
            </label>
            <input
              className={inputCls}
              value={receiptCompanyName}
              onChange={(e) => setReceiptCompanyName(e.target.value)}
              placeholder={t('tenantSettings.receiptCompanyNamePh')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('fiscalReceipt.stir')}
            </label>
            <input
              className={inputCls}
              value={receiptStir}
              onChange={(e) => setReceiptStir(e.target.value)}
              placeholder={t('tenantSettings.receiptStirPh')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('tenantSettings.receiptAddress')}
            </label>
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              value={receiptCompanyAddress}
              onChange={(e) => setReceiptCompanyAddress(e.target.value)}
              placeholder={t('tenantSettings.receiptAddressPh')}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('tenantSettings.receiptFieldsTitle')}
            </p>
            <button
              type="button"
              onClick={resetReceiptFields}
              className="text-xs text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              {t('tenantSettings.resetFields')}
            </button>
          </div>
          <SettingsFieldToggles
            defs={RECEIPT_FIELD_DEFS}
            values={receiptFields}
            onChange={setReceiptField}
            labelFor={(key) => t(key)}
          />
        </div>

        <ThermalPrintSettingsPanel compact />
      </div>
    </section>
  );
}

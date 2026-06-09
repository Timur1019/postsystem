import { useTranslation } from 'react-i18next';
import {
  RECEIPT_LOGO_HEIGHT_MIN_MM,
  RECEIPT_LOGO_HEIGHT_MAX_MM,
} from '../../../../utils/syncReceiptDisplayCssVars';

export default function ReceiptLogoSizeControl({ mm, onChange, previewDataUrl }) {
  const { t } = useTranslation();

  return (
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
          value={mm}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-[10rem] flex-1"
        />
        <span className="text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">
          {mm} {t('tenantSettings.receiptLogoMaxHeightUnit')}
        </span>
        {previewDataUrl ? (
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white px-2 dark:border-slate-600 dark:bg-slate-800"
            style={{ width: 120, height: Math.min(96, mm * 2.2) }}
          >
            <img
              src={previewDataUrl}
              alt=""
              className="receipt-logo max-w-full object-contain"
              style={{ maxHeight: `${mm}mm` }}
            />
          </div>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {t('tenantSettings.receiptLogoMaxHeightHint')}
      </p>
    </div>
  );
}

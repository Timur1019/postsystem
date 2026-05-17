// src/components/receipt/ThermalPrintSettingsPanel.jsx
import { useTranslation } from 'react-i18next';
import { Settings2 } from 'lucide-react';
import { usePrintSettingsStore } from '../../store/printSettingsStore';

const presetBtn =
  'rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/40';

const presetBtnMuted =
  'rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

export default function ThermalPrintSettingsPanel({ compact = false }) {
  const { t } = useTranslation();
  const paperWidthMm = usePrintSettingsStore((s) => s.paperWidthMm);
  const contentWidthMm = usePrintSettingsStore((s) => s.contentWidthMm);
  const pageMarginMm = usePrintSettingsStore((s) => s.pageMarginMm);
  const padHorizontalMm = usePrintSettingsStore((s) => s.padHorizontalMm);
  const padVerticalMm = usePrintSettingsStore((s) => s.padVerticalMm);
  const fontSizePx = usePrintSettingsStore((s) => s.fontSizePx);
  const lineHeight = usePrintSettingsStore((s) => s.lineHeight);
  const applyPaperPreset = usePrintSettingsStore((s) => s.applyPaperPreset);
  const setPaperWidthMm = usePrintSettingsStore((s) => s.setPaperWidthMm);
  const setContentWidthMm = usePrintSettingsStore((s) => s.setContentWidthMm);
  const setPageMarginMm = usePrintSettingsStore((s) => s.setPageMarginMm);
  const setPadHorizontalMm = usePrintSettingsStore((s) => s.setPadHorizontalMm);
  const setPadVerticalMm = usePrintSettingsStore((s) => s.setPadVerticalMm);
  const setFontSizePx = usePrintSettingsStore((s) => s.setFontSizePx);
  const setLineHeight = usePrintSettingsStore((s) => s.setLineHeight);
  const resetToDefaults = usePrintSettingsStore((s) => s.resetToDefaults);

  const fieldClass =
    'mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';
  const labelClass = 'text-xs font-medium text-slate-600 dark:text-slate-400';

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <Settings2 size={18} className="text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-sm font-semibold">{t('printSettings.title')}</h3>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={presetBtn} onClick={() => applyPaperPreset('80')}>
          {t('printSettings.preset80')}
        </button>
        <button type="button" className={presetBtn} onClick={() => applyPaperPreset('58')}>
          {t('printSettings.preset58')}
        </button>
        <button type="button" className={presetBtnMuted} onClick={() => resetToDefaults()}>
          {t('printSettings.reset')}
        </button>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        <div>
          <label className={labelClass} htmlFor="ps-paper">{t('printSettings.paperWidth')}</label>
          <input
            id="ps-paper"
            type="number"
            min={40}
            max={120}
            step={1}
            className={fieldClass}
            value={paperWidthMm}
            onChange={(e) => setPaperWidthMm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ps-content">{t('printSettings.contentWidth')}</label>
          <input
            id="ps-content"
            type="number"
            min={36}
            max={110}
            step={1}
            className={fieldClass}
            value={contentWidthMm}
            onChange={(e) => setContentWidthMm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ps-page-m">{t('printSettings.pageMargin')}</label>
          <input
            id="ps-page-m"
            type="number"
            min={0}
            max={12}
            step={0.5}
            className={fieldClass}
            value={pageMarginMm}
            onChange={(e) => setPageMarginMm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ps-pad-x">{t('printSettings.padH')}</label>
          <input
            id="ps-pad-x"
            type="number"
            min={0}
            max={8}
            step={0.5}
            className={fieldClass}
            value={padHorizontalMm}
            onChange={(e) => setPadHorizontalMm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ps-pad-y">{t('printSettings.padV')}</label>
          <input
            id="ps-pad-y"
            type="number"
            min={0}
            max={12}
            step={0.5}
            className={fieldClass}
            value={padVerticalMm}
            onChange={(e) => setPadVerticalMm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ps-font">{t('printSettings.fontSize')}</label>
          <input
            id="ps-font"
            type="number"
            min={7}
            max={16}
            step={1}
            className={fieldClass}
            value={fontSizePx}
            onChange={(e) => setFontSizePx(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ps-lh">{t('printSettings.lineHeight')}</label>
          <input
            id="ps-lh"
            type="number"
            min={1.05}
            max={1.8}
            step={0.05}
            className={fieldClass}
            value={lineHeight}
            onChange={(e) => setLineHeight(e.target.value)}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t('printSettings.hint')}</p>
    </div>
  );
}
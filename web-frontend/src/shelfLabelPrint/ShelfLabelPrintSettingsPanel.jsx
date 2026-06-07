import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  LABEL_SIZE_CATEGORIES,
  LABEL_SIZE_PRESETS,
  findLabelPresetByLayout,
  isWidePrinterPreset,
} from './constants';
import { clampNum, snapStep } from './labelLayoutUtils';
import { ToggleSwitch } from './ShelfLabelPrintControls';
import LabelTsplSettingsPanel from './LabelTsplSettingsPanel';

function formatNumValue(value, step) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const s = Number(step) || 1;
  if (s < 1) {
    const decimals = (String(s).split('.')[1] || '').length || 1;
    return String(Number(n.toFixed(decimals)));
  }
  return String(n);
}

function isPartialNumberInput(raw) {
  const s = String(raw ?? '').trim().replace(',', '.');
  return s === '' || s === '-' || s === '.' || s === '-.' || /^-?\d+\.$/.test(s);
}

function NumField({ label, value, onChange, min, max, step = 1, className = 'w-20' }) {
  const [draft, setDraft] = useState(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(null);
  }, [value, focused]);

  const commit = (raw) => {
    const trimmed = String(raw ?? '').trim().replace(',', '.');
    if (isPartialNumberInput(trimmed)) {
      onChange(snapStep(clampNum(value, min, max), step));
      return;
    }
    onChange(snapStep(clampNum(trimmed, min, max), step));
  };

  const displayValue = focused && draft !== null ? draft : formatNumValue(value, step);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        className={`rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white ${className}`}
        value={displayValue}
        onFocus={() => {
          setFocused(true);
          setDraft(formatNumValue(value, step));
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          commit(draft);
          setFocused(false);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </div>
  );
}

function formatPresetSize(preset) {
  const w = Number(preset.paperWmm);
  const h = Number(preset.paperHmm);
  const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
  return `${fmt(w)} × ${fmt(h)} мм`;
}

export default function ShelfLabelPrintSettingsPanel({
  t,
  layout,
  patchLayout,
  maxPadXmm,
  maxPadYmm,
  applyPreset,
  resetPresetDefaults,
  compact = false,
  sidebar = false,
}) {
  const [fineOpen, setFineOpen] = useState(false);
  const fineSectionRef = useRef(null);
  const activePreset = findLabelPresetByLayout(layout);

  useEffect(() => {
    if (!fineOpen || !fineSectionRef.current) return;
    fineSectionRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [fineOpen]);
  const activeId = activePreset?.id || layout.presetId;
  const rootCls = [
    'shelflabel-settings rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900',
    sidebar ? 'shelflabel-settings--sidebar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootCls}>
      <p className="shelflabel-settings__title text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('usersBarcodePrint.printSettings', { defaultValue: 'Настройки печати' })}
      </p>

      {!compact ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('usersBarcodePrint.settingsPersistHint', {
            defaultValue: 'Настройки сохраняются автоматически — подкрутите один раз под ваш принтер.',
          })}
        </p>
      ) : null}

      <LabelTsplSettingsPanel t={t} />

      <div className={`space-y-4 ${compact ? 'mt-3' : 'mt-4'}`}>
        {LABEL_SIZE_CATEGORIES.map((category) => {
          const presets = LABEL_SIZE_PRESETS.filter((p) => p.category === category.id);
          if (!presets.length) return null;

          return (
            <section key={category.id} className="shelflabel-settings__group">
              <h3 className="shelflabel-settings__group-title mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(category.i18nKey)}
              </h3>
              <div className="shelflabel-settings__preset-grid grid grid-cols-1 gap-2 sm:grid-cols-2">
                {presets.map((preset) => {
                  const active = activeId === preset.id;
                  const wide = isWidePrinterPreset(preset);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`shelflabel-settings__preset rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/40'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            active
                              ? 'text-emerald-900 dark:text-emerald-100'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {formatPresetSize(preset)}
                        </span>
                        {wide ? (
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                            title={t('usersBarcodePrint.widePrinterOnly')}
                          >
                            <AlertTriangle size={11} aria-hidden />
                            82+
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`mt-0.5 block text-xs ${
                          active ? 'text-emerald-800/90 dark:text-emerald-200/90' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {t(preset.i18nKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {!compact ? (
        <div className="shelflabel-settings__printer-guide mt-4 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2.5 text-xs text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
          <p className="font-semibold">{t('usersBarcodePrint.printerCalibrationTitle')}</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            <li>{t('usersBarcodePrint.printerCalibrationFeed')}</li>
            <li>{t('usersBarcodePrint.printerCalibrationDriver')}</li>
            <li>{t('usersBarcodePrint.printerCalibrationOffset')}</li>
          </ol>
        </div>
      ) : null}

      {activePreset ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {t('usersBarcodePrint.windowsProfileTitle', { defaultValue: 'Профиль в Windows' })}
          </p>
          <p className="mt-1">
            {t('usersBarcodePrint.windowsProfileHint', {
              defaultValue: 'Создайте пользовательский формат бумаги с именем «{{profile}}» — точно {{w}} × {{h}} мм.',
              profile: activePreset.profileId,
              w: formatPresetSize(activePreset).replace(/ × .*$/, ''),
              h: Number(activePreset.paperHmm) % 1
                ? Number(activePreset.paperHmm).toFixed(2)
                : Number(activePreset.paperHmm),
            })}
          </p>
          {isWidePrinterPreset(activePreset) ? (
            <p className="mt-2 flex items-start gap-1.5 text-amber-800 dark:text-amber-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              {t('usersBarcodePrint.widePrinterWarning')}
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t('usersBarcodePrint.calibrationTitle', { defaultValue: 'Калибровка печати' })}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {t('usersBarcodePrint.calibrationHint', {
                defaultValue: 'Сдвиги по умолчанию 0. Подстройте после калибровки FEED и драйвера Windows.',
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={resetPresetDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <RotateCcw size={14} aria-hidden />
            {t('usersBarcodePrint.resetPresetDefaults', { defaultValue: 'Сбросить эталон' })}
          </button>
        </div>

        <div className="space-y-3">
          <ToggleSwitch
            label={t('usersBarcodePrint.rotate180', { defaultValue: 'Повернуть на 180°' })}
            checked={layout.rotate180}
            onChange={(rotate180) => patchLayout({ rotate180 })}
          />
          <NumField
            label={t('usersBarcodePrint.offsetX', { defaultValue: 'Сдвиг вправо (мм)' })}
            value={layout.offsetXmm ?? 0}
            min={-5}
            max={5}
            step={0.1}
            onChange={(offsetXmm) => patchLayout({ offsetXmm })}
          />
          <NumField
            label={t('usersBarcodePrint.offsetY', { defaultValue: 'Сдвиг вверх (мм)' })}
            value={layout.offsetYmm ?? 0}
            min={-5}
            max={5}
            step={0.1}
            onChange={(offsetYmm) => patchLayout({ offsetYmm })}
          />
          <p className="shelflabel-settings__offset-hint rounded-md bg-white/70 px-2 py-1.5 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
            {t('usersBarcodePrint.offsetCalibrationHint')}
          </p>
          <NumField
            label={t('usersBarcodePrint.padX', { defaultValue: 'Отступ слева/справа (мм)' })}
            value={layout.padXmm}
            min={0}
            max={maxPadXmm}
            step={0.5}
            onChange={(padXmm) => patchLayout({ padXmm })}
          />
          <NumField
            label={t('usersBarcodePrint.padY', { defaultValue: 'Отступ сверху/снизу (мм)' })}
            value={layout.padYmm}
            min={0}
            max={maxPadYmm}
            step={0.5}
            onChange={(padYmm) => patchLayout({ padYmm })}
          />
        </div>
      </section>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => setFineOpen((v) => !v)}
        aria-expanded={fineOpen}
      >
        {t('usersBarcodePrint.fineSettings', { defaultValue: 'Тонкая настройка' })}
        {fineOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {fineOpen ? (
        <div
          ref={fineSectionRef}
          className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-700 dark:text-slate-200">
              {t('usersBarcodePrint.textScale', { defaultValue: 'Размер текста' })}
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.02"
                value={layout.fontScale}
                onChange={(e) => patchLayout({ fontScale: clampNum(e.target.value, 0.8, 1.6) })}
              />
              <span className="w-12 text-right font-mono text-sm text-slate-600 dark:text-slate-300">
                {Number(layout.fontScale).toFixed(2)}
              </span>
            </div>
          </div>
          <NumField
            label={t('usersBarcodePrint.pageMargin', { defaultValue: 'Поля @page (мм)' })}
            value={layout.pageMarginMm}
            min={0}
            max={10}
            step={0.5}
            className="w-24"
            onChange={(pageMarginMm) => patchLayout({ pageMarginMm })}
          />
        </div>
      ) : null}
    </div>
  );
}

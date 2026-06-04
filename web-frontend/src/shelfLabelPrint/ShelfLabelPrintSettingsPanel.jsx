import { LABEL_SIZE_PRESETS } from './constants';
import { clampNum, snapStep } from './labelLayoutUtils';
import { ToggleSwitch } from './ShelfLabelPrintControls';

function NumField({ label, value, onChange, min, max, step = 1, className = 'w-20' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        className={`rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white ${className}`}
        value={value}
        onChange={(e) => onChange(snapStep(clampNum(e.target.value, min, max), step))}
      />
    </div>
  );
}

export default function ShelfLabelPrintSettingsPanel({ t, layout, patchLayout, maxPadXmm, maxPadYmm, applyPreset }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('usersBarcodePrint.printSettings', { defaultValue: 'Настройки печати' })}
      </p>

      <div className="mt-3 space-y-3">
        <ToggleSwitch
          label={t('usersBarcodePrint.rotate180', { defaultValue: 'Повернуть на 180°' })}
          checked={layout.rotate180}
          onChange={(rotate180) => patchLayout({ rotate180 })}
        />

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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumField
            label={t('usersBarcodePrint.paperW', { defaultValue: 'Ширина (мм)' })}
            value={layout.paperWmm}
            min={30}
            max={120}
            className="w-24"
            onChange={(paperWmm) => patchLayout({ paperWmm })}
          />
          <NumField
            label={t('usersBarcodePrint.paperH', { defaultValue: 'Высота (мм)' })}
            value={layout.paperHmm}
            min={20}
            max={150}
            className="w-24"
            onChange={(paperHmm) => patchLayout({ paperHmm })}
          />
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

        <div>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            {t('usersBarcodePrint.sizePresets', { defaultValue: 'Типовые размеры' })}
          </p>
          <div className="flex flex-wrap gap-2">
            {LABEL_SIZE_PRESETS.map((preset) => {
              const active =
                Number(layout.paperWmm) === preset.paperWmm && Number(layout.paperHmm) === preset.paperHmm;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

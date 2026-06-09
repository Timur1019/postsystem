import { Calendar } from 'lucide-react';

export default function DashboardDateRangePicker({
  t,
  from,
  to,
  onFromChange,
  onToChange,
  presets,
  onPreset,
  isPresetActive,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
        />
        <span className="text-slate-400 dark:text-slate-500">—</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onPreset(preset)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                active
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {t(`reports.${preset.key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

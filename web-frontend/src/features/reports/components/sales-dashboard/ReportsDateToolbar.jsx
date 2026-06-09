import { Calendar } from 'lucide-react';

export default function ReportsDateToolbar({ t, from, to, onFromChange, onToChange, presets, onPreset }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
        />
        <span className="text-slate-400 dark:text-slate-500">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onPreset(preset)}
            className="rounded-lg bg-slate-200 px-3 py-2 text-xs text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {t(`reports.${preset.key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

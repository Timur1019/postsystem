import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfMonth } from 'date-fns';

export default function ReportDateBar({ from, to, onFrom, onTo }) {
  const { t } = useTranslation();
  const presets = [
    { key: 'presetToday', from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset7', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset30', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'presetMonth', from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Calendar size={14} className="text-slate-500" />
        <input
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
        />
        <span className="text-slate-400">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              onFrom(p.from());
              onTo(p.to());
            }}
            className="rounded-lg bg-slate-200 px-3 py-2 text-xs text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {t(`reports.${p.key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

import { Plus } from 'lucide-react';

export default function WriteOffsReportHeader({ t, onNewWriteOff }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.writeOffsTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.writeOffsSubtitle')}</p>
      </div>
      <button
        type="button"
        onClick={onNewWriteOff}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        <Plus size={16} />
        {t('stockReports.newWriteOff')}
      </button>
    </div>
  );
}

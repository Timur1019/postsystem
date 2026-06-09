import { Trash2 } from 'lucide-react';
import { cardCls } from '../../../../utils/platformMonitoringFormat';
import PlatformMonitoringLogRow from './PlatformMonitoringLogRow';

export default function PlatformMonitoringLogsTab({
  t,
  logLevel,
  setLogLevel,
  logs,
  logsQuery,
  clearLogsMutation,
}) {
  return (
    <div className={cardCls}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-700">
          {[
            { v: '', label: t('platform.monitoring.allLevels') },
            { v: 'ERROR', label: 'ERROR' },
            { v: 'WARN', label: 'WARN' },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setLogLevel(opt.v)}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                logLevel === opt.v
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">
          {logs.length} {t('platform.monitoring.records')}
        </span>
        <button
          type="button"
          onClick={() => clearLogsMutation.mutate()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-500/10"
        >
          <Trash2 size={14} />
          {t('platform.monitoring.clearLogs')}
        </button>
      </div>
      <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
              <th className="px-3 py-2">{t('platform.monitoring.time')}</th>
              <th className="px-3 py-2">{t('platform.monitoring.level')}</th>
              <th className="px-3 py-2">{t('platform.monitoring.logger')}</th>
              <th className="px-3 py-2">{t('platform.monitoring.message')}</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {logsQuery.isPending ? (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">{t('common.loading')}</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">{t('platform.monitoring.noLogs')}</td></tr>
            ) : (
              logs.map((ev, i) => <PlatformMonitoringLogRow key={`${ev.timestamp}-${i}`} event={ev} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

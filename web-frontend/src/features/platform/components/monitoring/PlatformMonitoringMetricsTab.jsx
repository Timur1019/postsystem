import { Search } from 'lucide-react';
import { cardCls } from '../../../../utils/platformMonitoringFormat';

export default function PlatformMonitoringMetricsTab({
  t,
  search,
  setSearch,
  metricsQuery,
  metrics,
  selectedMetric,
  setSelectedMetric,
  metricDetailQuery,
  metricDetail,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
      <div className={cardCls}>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('platform.monitoring.searchMetrics')}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="max-h-[480px] overflow-auto divide-y dark:divide-slate-800">
          {metricsQuery.isPending ? (
            <p className="p-3 text-center text-sm text-slate-500">{t('common.loading')}</p>
          ) : metrics.length === 0 ? (
            <p className="p-3 text-center text-sm text-slate-500">{t('common.noData')}</p>
          ) : (
            metrics.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setSelectedMetric(m.name)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  selectedMetric === m.name
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-mono text-xs">{m.name}</div>
                {m.description ? (
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{m.description}</div>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>
      <div className={cardCls}>
        {selectedMetric ? (
          metricDetailQuery.isPending ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : metricDetail ? (
            <div>
              <h3 className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                {metricDetail.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {metricDetail.type}
                {metricDetail.baseUnit ? ` · ${metricDetail.baseUnit}` : ''}
              </p>
              {metricDetail.description ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {metricDetail.description}
                </p>
              ) : null}
              <div className="mt-4 space-y-3">
                {metricDetail.samples.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                  >
                    {Object.keys(s.tags).length > 0 ? (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {Object.entries(s.tags).map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {k}={v}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(s.measurements).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-2">
                          <span className="text-xs uppercase text-slate-500">{k}</span>
                          <span className="font-mono text-slate-800 dark:text-slate-100">
                            {Number.isInteger(v) ? v : v.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('common.noData')}</p>
          )
        ) : (
          <p className="text-sm text-slate-500">{t('platform.monitoring.selectMetric')}</p>
        )}
      </div>
    </div>
  );
}

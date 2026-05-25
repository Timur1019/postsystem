// src/pages/platform/PlatformMonitoringPage.jsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Gauge,
  Layers,
  MemoryStick,
  RefreshCcw,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import { platformMonitoringApi } from '../../services/api';

const REFRESH_MS = 5000;

const cardCls =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';

function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${(value > 1 ? value : value * 100).toFixed(1)}%`;
}

function formatNumber(value, fractionDigits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatDuration(ms) {
  if (ms == null) return '—';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatCard({ icon: Icon, color, label, value, hint }) {
  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function LevelBadge({ level }) {
  const map = {
    ERROR: 'bg-red-500/15 text-red-600 dark:text-red-300',
    WARN: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    INFO: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
    DEBUG: 'bg-slate-500/15 text-slate-500',
  };
  const cls = map[level] || 'bg-slate-500/15 text-slate-500';
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {level}
    </span>
  );
}

function LogRow({ event }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setOpen((v) => !v)}>
        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
          {formatTimestamp(event.timestamp)}
        </td>
        <td className="px-3 py-2"><LevelBadge level={event.level} /></td>
        <td className="px-3 py-2 font-mono text-xs text-slate-500">{event.logger}</td>
        <td className="px-3 py-2 text-sm">{event.message}</td>
        <td className="w-8 px-2 py-2 text-slate-400">
          {event.throwable ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
        </td>
      </tr>
      {open && event.throwable ? (
        <tr className="bg-slate-50 dark:bg-slate-900/60">
          <td colSpan={5} className="px-3 pb-3">
            <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-snug text-slate-100">
              {event.throwable}
            </pre>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default function PlatformMonitoringPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [logLevel, setLogLevel] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['platform-monitoring', 'overview'],
    queryFn: () => platformMonitoringApi.overview().then((r) => r.data),
    refetchInterval: REFRESH_MS,
  });

  const metricsQuery = useQuery({
    queryKey: ['platform-monitoring', 'metrics', search],
    queryFn: () => platformMonitoringApi.metrics(search || undefined).then((r) => r.data),
    enabled: tab === 'metrics',
    refetchInterval: tab === 'metrics' ? REFRESH_MS : false,
  });

  const metricDetailQuery = useQuery({
    queryKey: ['platform-monitoring', 'metric', selectedMetric],
    queryFn: () =>
      platformMonitoringApi.metricDetail(selectedMetric).then((r) => r.data),
    enabled: tab === 'metrics' && !!selectedMetric,
    refetchInterval: tab === 'metrics' && selectedMetric ? REFRESH_MS : false,
  });

  const logsQuery = useQuery({
    queryKey: ['platform-monitoring', 'logs', logLevel],
    queryFn: () =>
      platformMonitoringApi
        .logs({ limit: 300, level: logLevel || undefined })
        .then((r) => r.data),
    enabled: tab === 'logs',
    refetchInterval: tab === 'logs' ? REFRESH_MS : false,
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => platformMonitoringApi.clearLogs(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-monitoring', 'logs'] });
      toast.success(t('platform.monitoring.logsCleared'));
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? t('platform.monitoring.actionFailed')),
  });

  const overview = overviewQuery.data;
  const metrics = metricsQuery.data ?? [];
  const metricDetail = metricDetailQuery.data;
  const logs = logsQuery.data ?? [];

  const cpuPercent = useMemo(() => {
    if (!overview?.cpu?.processUsage) return null;
    return overview.cpu.processUsage * 100;
  }, [overview]);

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['platform-monitoring'] });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('platform.monitoring.title')}
          </h1>
          <p className="text-sm text-slate-500">{t('platform.monitoring.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {t('platform.monitoring.autoRefresh')}
          </span>
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            <RefreshCcw size={14} />
            {t('platform.monitoring.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          icon={Cpu}
          color="bg-indigo-500"
          label={t('platform.monitoring.cpu')}
          value={formatPercent(cpuPercent)}
          hint={
            overview?.cpu
              ? `${t('platform.monitoring.system')}: ${formatPercent(
                  overview.cpu.systemUsage ? overview.cpu.systemUsage * 100 : null
                )} · ${overview.cpu.availableProcessors} cores`
              : '—'
          }
        />
        <StatCard
          icon={MemoryStick}
          color="bg-emerald-500"
          label={t('platform.monitoring.heap')}
          value={formatPercent(overview?.memory?.heapUsedPercent)}
          hint={
            overview?.memory
              ? `${formatBytes(overview.memory.heapUsedBytes)} / ${formatBytes(
                  overview.memory.heapMaxBytes
                )}`
              : '—'
          }
        />
        <StatCard
          icon={Layers}
          color="bg-cyan-500"
          label={t('platform.monitoring.threads')}
          value={overview?.jvm?.threadsLive ?? '—'}
          hint={
            overview?.jvm
              ? `${t('platform.monitoring.peak')}: ${overview.jvm.threadsPeak} · ${
                  t('platform.monitoring.daemon')
                }: ${overview.jvm.threadsDaemon}`
              : '—'
          }
        />
        <StatCard
          icon={Database}
          color="bg-blue-500"
          label={t('platform.monitoring.dbPool')}
          value={
            overview?.database?.poolActive != null
              ? `${overview.database.poolActive} / ${overview.database.poolMax ?? '—'}`
              : '—'
          }
          hint={
            overview?.database
              ? `${t('platform.monitoring.idle')}: ${
                  overview.database.poolIdle ?? '—'
                } · ${t('platform.monitoring.pending')}: ${overview.database.poolPendingThreads ?? 0}`
              : '—'
          }
        />
        <StatCard
          icon={Zap}
          color="bg-violet-500"
          label={t('platform.monitoring.httpReq')}
          value={formatNumber(overview?.http?.totalRequests)}
          hint={
            overview?.http?.avgResponseMs != null
              ? `${t('platform.monitoring.avg')}: ${overview.http.avgResponseMs.toFixed(0)} ms · max ${
                  overview.http.maxResponseMs?.toFixed(0) ?? '—'
                } ms`
              : '—'
          }
        />
        <StatCard
          icon={Gauge}
          color="bg-amber-500"
          label={t('platform.monitoring.uptime')}
          value={formatDuration(overview?.uptimeMs)}
          hint={overview ? `${overview.appVersion} · ${overview.activeProfile}` : '—'}
        />
        <StatCard
          icon={AlertTriangle}
          color="bg-red-500"
          label={t('platform.monitoring.errors24h')}
          value={overview?.errorCount24h ?? 0}
          hint={`${t('platform.monitoring.warnings')}: ${overview?.warnCount24h ?? 0}`}
        />
        <StatCard
          icon={Activity}
          color="bg-slate-500"
          label={t('platform.monitoring.nonHeap')}
          value={formatBytes(overview?.memory?.nonHeapUsedBytes)}
          hint={overview ? `classes: ${overview.jvm?.classesLoaded ?? '—'}` : '—'}
        />
      </div>

      <div className="flex gap-2 border-b border-slate-200 text-sm dark:border-slate-800">
        {[
          { id: 'overview', label: t('platform.monitoring.tabOverview') },
          { id: 'metrics', label: t('platform.monitoring.tabMetrics') },
          { id: 'logs', label: t('platform.monitoring.tabLogs') },
        ].map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setTab(it.id)}
            className={`-mb-px border-b-2 px-3 py-2 font-medium transition-colors ${
              tab === it.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className={cardCls}>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">
            {t('platform.monitoring.recentErrors')}
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            {t('platform.monitoring.recentErrorsHint')}
          </p>
          <RecentErrorsTable />
        </div>
      ) : null}

      {tab === 'metrics' ? (
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
      ) : null}

      {tab === 'logs' ? (
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
                  logs.map((ev, i) => <LogRow key={`${ev.timestamp}-${i}`} event={ev} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RecentErrorsTable() {
  const { t } = useTranslation();
  const { data = [], isPending } = useQuery({
    queryKey: ['platform-monitoring', 'logs', 'overview-errors'],
    queryFn: () =>
      platformMonitoringApi.logs({ limit: 20, level: 'ERROR' }).then((r) => r.data),
    refetchInterval: REFRESH_MS,
  });

  if (isPending) return <p className="text-sm text-slate-500">{t('common.loading')}</p>;
  if (data.length === 0) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-6 text-center text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        {t('platform.monitoring.noErrors')}
      </p>
    );
  }
  return (
    <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
            <th className="px-3 py-2">{t('platform.monitoring.time')}</th>
            <th className="px-3 py-2">{t('platform.monitoring.logger')}</th>
            <th className="px-3 py-2">{t('platform.monitoring.message')}</th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-slate-800">
          {data.map((ev, i) => <LogRow key={`${ev.timestamp}-${i}`} event={ev} />)}
        </tbody>
      </table>
    </div>
  );
}

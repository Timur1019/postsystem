// src/pages/platform/PlatformMonitoringPage.jsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Gauge,
  Layers,
  MemoryStick,
  RefreshCcw,
  Zap,
} from 'lucide-react';
import { platformMonitoringApi } from '../../services/api';
import {
  formatBytes,
  formatDuration,
  formatNumber,
  formatPercent,
} from '../../utils/platformMonitoringFormat';
import PlatformMonitoringStatCard from '../../components/platform/monitoring/PlatformMonitoringStatCard';
import PlatformMonitoringOverviewTab from '../../components/platform/monitoring/PlatformMonitoringOverviewTab';
import PlatformMonitoringMetricsTab from '../../components/platform/monitoring/PlatformMonitoringMetricsTab';
import PlatformMonitoringLogsTab from '../../components/platform/monitoring/PlatformMonitoringLogsTab';

const REFRESH_MS = 5000;

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
        <PlatformMonitoringStatCard
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
        <PlatformMonitoringStatCard
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
        <PlatformMonitoringStatCard
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
        <PlatformMonitoringStatCard
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
        <PlatformMonitoringStatCard
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
        <PlatformMonitoringStatCard
          icon={Gauge}
          color="bg-amber-500"
          label={t('platform.monitoring.uptime')}
          value={formatDuration(overview?.uptimeMs)}
          hint={overview ? `${overview.appVersion} · ${overview.activeProfile}` : '—'}
        />
        <PlatformMonitoringStatCard
          icon={AlertTriangle}
          color="bg-red-500"
          label={t('platform.monitoring.errors24h')}
          value={overview?.errorCount24h ?? 0}
          hint={`${t('platform.monitoring.warnings')}: ${overview?.warnCount24h ?? 0}`}
        />
        <PlatformMonitoringStatCard
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

      {tab === 'overview' ? <PlatformMonitoringOverviewTab /> : null}

      {tab === 'metrics' ? (
        <PlatformMonitoringMetricsTab
          t={t}
          search={search}
          setSearch={setSearch}
          metricsQuery={metricsQuery}
          metrics={metrics}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          metricDetailQuery={metricDetailQuery}
          metricDetail={metricDetail}
        />
      ) : null}

      {tab === 'logs' ? (
        <PlatformMonitoringLogsTab
          t={t}
          logLevel={logLevel}
          setLogLevel={setLogLevel}
          logs={logs}
          logsQuery={logsQuery}
          clearLogsMutation={clearLogsMutation}
        />
      ) : null}
    </div>
  );
}

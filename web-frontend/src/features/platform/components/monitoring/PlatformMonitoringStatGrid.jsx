import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Gauge,
  Layers,
  MemoryStick,
  Zap,
} from 'lucide-react';
import {
  formatBytes,
  formatDuration,
  formatNumber,
  formatPercent,
} from '../../../../utils/platformMonitoringFormat';
import PlatformMonitoringStatCard from './PlatformMonitoringStatCard';

export default function PlatformMonitoringStatGrid({ t, overview, cpuPercent }) {
  return (
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
            ? `${formatBytes(overview.memory.heapUsedBytes)} / ${formatBytes(overview.memory.heapMaxBytes)}`
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
            ? `${t('platform.monitoring.peak')}: ${overview.jvm.threadsPeak} · ${t('platform.monitoring.daemon')}: ${overview.jvm.threadsDaemon}`
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
            ? `${t('platform.monitoring.idle')}: ${overview.database.poolIdle ?? '—'} · ${t('platform.monitoring.pending')}: ${overview.database.poolPendingThreads ?? 0}`
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
            ? `${t('platform.monitoring.avg')}: ${overview.http.avgResponseMs.toFixed(0)} ms · max ${overview.http.maxResponseMs?.toFixed(0) ?? '—'} ms`
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
  );
}

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformMonitoringApi } from '../../../api';

export const PLATFORM_MONITORING_REFRESH_MS = 5000;

export function usePlatformMonitoringPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [logLevel, setLogLevel] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['platform-monitoring', 'overview'],
    queryFn: () => platformMonitoringApi.overview().then((r) => r.data),
    refetchInterval: PLATFORM_MONITORING_REFRESH_MS,
  });

  const metricsQuery = useQuery({
    queryKey: ['platform-monitoring', 'metrics', search],
    queryFn: () => platformMonitoringApi.metrics(search || undefined).then((r) => r.data),
    enabled: tab === 'metrics',
    refetchInterval: tab === 'metrics' ? PLATFORM_MONITORING_REFRESH_MS : false,
  });

  const metricDetailQuery = useQuery({
    queryKey: ['platform-monitoring', 'metric', selectedMetric],
    queryFn: () => platformMonitoringApi.metricDetail(selectedMetric).then((r) => r.data),
    enabled: tab === 'metrics' && !!selectedMetric,
    refetchInterval: tab === 'metrics' && selectedMetric ? PLATFORM_MONITORING_REFRESH_MS : false,
  });

  const logsQuery = useQuery({
    queryKey: ['platform-monitoring', 'logs', logLevel],
    queryFn: () =>
      platformMonitoringApi
        .logs({ limit: 300, level: logLevel || undefined })
        .then((r) => r.data),
    enabled: tab === 'logs',
    refetchInterval: tab === 'logs' ? PLATFORM_MONITORING_REFRESH_MS : false,
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

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('platform.monitoring.tabOverview') },
      { id: 'metrics', label: t('platform.monitoring.tabMetrics') },
      { id: 'logs', label: t('platform.monitoring.tabLogs') },
    ],
    [t]
  );

  return {
    t,
    tab,
    setTab,
    tabs,
    search,
    setSearch,
    selectedMetric,
    setSelectedMetric,
    logLevel,
    setLogLevel,
    overview,
    overviewQuery,
    metricsQuery,
    metrics,
    metricDetailQuery,
    metricDetail,
    logsQuery,
    logs,
    clearLogsMutation,
    cpuPercent,
    refreshAll,
  };
}

import PlatformMonitoringOverviewTab from './PlatformMonitoringOverviewTab';
import PlatformMonitoringMetricsTab from './PlatformMonitoringMetricsTab';
import PlatformMonitoringLogsTab from './PlatformMonitoringLogsTab';

export default function PlatformMonitoringTabPanels({ tab, p }) {
  if (tab === 'overview') {
    return <PlatformMonitoringOverviewTab />;
  }

  if (tab === 'metrics') {
    return (
      <PlatformMonitoringMetricsTab
        t={p.t}
        search={p.search}
        setSearch={p.setSearch}
        metricsQuery={p.metricsQuery}
        metrics={p.metrics}
        selectedMetric={p.selectedMetric}
        setSelectedMetric={p.setSelectedMetric}
        metricDetailQuery={p.metricDetailQuery}
        metricDetail={p.metricDetail}
      />
    );
  }

  if (tab === 'logs') {
    return (
      <PlatformMonitoringLogsTab
        t={p.t}
        logLevel={p.logLevel}
        setLogLevel={p.setLogLevel}
        logs={p.logs}
        logsQuery={p.logsQuery}
        clearLogsMutation={p.clearLogsMutation}
      />
    );
  }

  return null;
}

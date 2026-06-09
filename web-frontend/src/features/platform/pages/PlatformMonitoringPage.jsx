import { RefreshCcw } from 'lucide-react';
import { BaseButton, PageLayout } from '../../../components/ui';
import PlatformMonitoringStatGrid from '../components/monitoring/PlatformMonitoringStatGrid';
import PlatformMonitoringTabBar from '../components/monitoring/PlatformMonitoringTabBar';
import PlatformMonitoringTabPanels from '../components/monitoring/PlatformMonitoringTabPanels';
import { usePlatformMonitoringPage } from '../hooks/usePlatformMonitoringPage';

export default function PlatformMonitoringPage() {
  const p = usePlatformMonitoringPage();

  return (
    <PageLayout
      spacing="space-y-5"
      title={p.t('platform.monitoring.title')}
      subtitle={p.t('platform.monitoring.subtitle')}
      actions={(
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {p.t('platform.monitoring.autoRefresh')}
          </span>
          <BaseButton variant="secondary" onClick={p.refreshAll}>
            <RefreshCcw size={14} />
            {p.t('platform.monitoring.refresh')}
          </BaseButton>
        </div>
      )}
    >
      <PlatformMonitoringStatGrid t={p.t} overview={p.overview} cpuPercent={p.cpuPercent} />
      <PlatformMonitoringTabBar tabs={p.tabs} activeTab={p.tab} onTabChange={p.setTab} />
      <PlatformMonitoringTabPanels tab={p.tab} p={p} />
    </PageLayout>
  );
}

import { PageLayout } from '../../../components/ui';
import DashboardChartsRow from '../components/DashboardChartsRow';
import DashboardDateRangePicker from '../components/DashboardDateRangePicker';
import DashboardKpiGrid from '../components/DashboardKpiGrid';
import DashboardLowStockTable from '../components/DashboardLowStockTable';
import { useDashboardPage } from '../hooks/useDashboardPage';

export default function DashboardPage() {
  const p = useDashboardPage();

  return (
    <PageLayout
      title={p.t('dashboard.title')}
      subtitle={p.periodLabel}
      actions={(
        <DashboardDateRangePicker
          t={p.t}
          from={p.from}
          to={p.to}
          onFromChange={p.setFrom}
          onToChange={p.setTo}
          presets={p.presets}
          onPreset={p.applyPreset}
          isPresetActive={p.isPresetActive}
        />
      )}
    >
      {p.invalidRange ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          {p.t('dashboard.invalidRange')}
        </p>
      ) : null}

      <DashboardKpiGrid t={p.t} isSingleDay={p.isSingleDay} kpis={p.kpis} />
      <DashboardChartsRow t={p.t} periodReport={p.periodReport} topProducts={p.topProducts} />
      <DashboardLowStockTable t={p.t} lowStock={p.lowStock} />
    </PageLayout>
  );
}

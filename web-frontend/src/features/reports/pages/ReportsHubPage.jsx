import ReportsHubSection from '../components/ReportsHubSection';
import { useReportsHubPage } from '../hooks/useReportsHubPage';

export default function ReportsHubPage() {
  const { t, salesLinks, stockLinks } = useReportsHubPage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('reportsHub.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('reportsHub.subtitle')}</p>
      </div>

      <ReportsHubSection
        title={t('reportsHub.salesSection')}
        subtitle={t('reportsHub.salesSectionHint')}
        links={salesLinks}
        t={t}
      />

      <ReportsHubSection
        title={t('reportsHub.stockSection')}
        subtitle={t('reportsHub.stockSectionHint')}
        links={stockLinks}
        t={t}
      />
    </div>
  );
}

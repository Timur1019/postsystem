import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { platformMonitoringApi } from '../../../services/api';
import { cardCls } from '../../../utils/platformMonitoringFormat';
import PlatformMonitoringLogRow from './PlatformMonitoringLogRow';

const REFRESH_MS = 5000;

export default function PlatformMonitoringOverviewTab() {
  const { t } = useTranslation();
  const { data = [], isPending } = useQuery({
    queryKey: ['platform-monitoring', 'logs', 'overview-errors'],
    queryFn: () =>
      platformMonitoringApi.logs({ limit: 20, level: 'ERROR' }).then((r) => r.data),
    refetchInterval: REFRESH_MS,
  });

  return (
    <div className={cardCls}>
      <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">
        {t('platform.monitoring.recentErrors')}
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        {t('platform.monitoring.recentErrorsHint')}
      </p>
      {isPending ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : data.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-6 text-center text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {t('platform.monitoring.noErrors')}
        </p>
      ) : (
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
              {data.map((ev, i) => (
                <PlatformMonitoringLogRow key={`${ev.timestamp}-${i}`} event={ev} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

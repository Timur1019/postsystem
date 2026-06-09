export default function ReportsSummaryCards({ t, cards, isLoading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ icon: Icon, labelKey, value }) => (
        <div
          key={labelKey}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-4"
        >
          <p className="text-xs text-slate-600 dark:text-slate-400">{t(`reports.${labelKey}`)}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {isLoading ? t('common.dots') : value}
          </p>
        </div>
      ))}
    </div>
  );
}

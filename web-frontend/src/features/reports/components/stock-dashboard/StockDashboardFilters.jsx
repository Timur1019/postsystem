import ReportDateBar from '../../../../components/shared/ReportDateBar';

export default function StockDashboardFilters({ t, from, to, onFrom, onTo, storeId, onStoreChange, stores }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ReportDateBar from={from} to={to} onFrom={onFrom} onTo={onTo} />
      <select
        value={storeId}
        onChange={(e) => onStoreChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      >
        <option value="">{t('stockReports.allStores')}</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}

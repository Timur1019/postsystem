import { BaseSelect } from '../../../../components/ui';
import ReportDateBar from '../../../../components/shared/ReportDateBar';

export default function StockDashboardFilters({ t, from, to, onFrom, onTo, storeId, onStoreChange, stores }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ReportDateBar from={from} to={to} onFrom={onFrom} onTo={onTo} />
      <BaseSelect
        value={storeId}
        onChange={(e) => onStoreChange(e.target.value)}
        placeholder={t('stockReports.allStores')}
        options={[
          { value: '', label: t('stockReports.allStores') },
          ...stores.map((s) => ({ value: String(s.id), label: s.name })),
        ]}
      />
    </div>
  );
}

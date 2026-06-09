import ReportDateBar from '../../../../components/shared/ReportDateBar';
import ReportStoreSelect from '../ReportStoreSelect';

export default function WriteOffsReportFilters({
  from,
  to,
  onFrom,
  onTo,
  stores,
  storeId,
  onStoreChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ReportDateBar from={from} to={to} onFrom={onFrom} onTo={onTo} />
      <ReportStoreSelect stores={stores} value={storeId} onChange={onStoreChange} />
    </div>
  );
}

import ReportDateBar from '../../../../../components/shared/ReportDateBar';
import { LIFECYCLE_MOVEMENT_TYPES } from '../../../utils/productLifecycleUi';

export default function ProductLifecycleFilters({
  t,
  from,
  to,
  onFromChange,
  onToChange,
  movementType,
  onMovementTypeChange,
  showStoreFilter,
  storeId,
  onStoreChange,
  stores,
}) {
  return (
    <>
      <ReportDateBar from={from} to={to} onFrom={onFromChange} onTo={onToChange} />

      <div className="flex flex-wrap gap-3">
        <select
          value={movementType}
          onChange={(e) => onMovementTypeChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {LIFECYCLE_MOVEMENT_TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {t(`stockReports.movementTypes.${tp}`, { defaultValue: tp })}
            </option>
          ))}
        </select>
        {showStoreFilter && (
          <select
            value={storeId}
            onChange={(e) => onStoreChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">{t('stockReports.allStores')}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}

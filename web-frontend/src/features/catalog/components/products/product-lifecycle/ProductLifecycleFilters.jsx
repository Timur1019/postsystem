import { BaseSelect } from '../../../../../components/ui';
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
        <BaseSelect
          value={movementType}
          onChange={(e) => onMovementTypeChange(e.target.value)}
          options={LIFECYCLE_MOVEMENT_TYPES.map((tp) => ({
            value: tp,
            label: t(`stockReports.movementTypes.${tp}`, { defaultValue: tp }),
          }))}
        />
        {showStoreFilter ? (
          <BaseSelect
            value={storeId}
            onChange={(e) => onStoreChange(e.target.value)}
            placeholder={t('stockReports.allStores')}
            options={[
              { value: '', label: t('stockReports.allStores') },
              ...stores.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
        ) : null}
      </div>
    </>
  );
}

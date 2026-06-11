import { BaseButton } from '../../../components/ui';

export default function FinanceBulkToolbar({
  t,
  count,
  onDelete,
  onEnable,
  onDisable,
  deleteLabel,
  enableLabel,
  disableLabel,
  isPending = false,
}) {
  if (!count) return null;

  return (
    <div className="finance-bulk-toolbar">
      <span className="finance-bulk-toolbar__count">
        {t('finance.bulk.selected', { count })}
      </span>
      <div className="finance-bulk-toolbar__actions">
        {onEnable ? (
          <BaseButton size="sm" variant="secondary" onClick={onEnable} disabled={isPending}>
            {enableLabel ?? t('finance.bulk.enable')}
          </BaseButton>
        ) : null}
        {onDisable ? (
          <BaseButton size="sm" variant="secondary" onClick={onDisable} disabled={isPending}>
            {disableLabel ?? t('finance.bulk.disable')}
          </BaseButton>
        ) : null}
        {onDelete ? (
          <BaseButton size="sm" variant="danger" onClick={onDelete} disabled={isPending}>
            {deleteLabel ?? t('finance.bulk.delete')}
          </BaseButton>
        ) : null}
      </div>
    </div>
  );
}

import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import { BaseButton } from '../../../components/ui';

export default function FinanceRowActions({
  t,
  onEdit,
  onDelete,
  onToggle,
  isActive,
  canEdit = true,
  canDelete = true,
  canToggle = false,
  deletePending = false,
}) {
  return (
    <div className="finance-row-actions">
      {canEdit && onEdit ? (
        <BaseButton
          size="sm"
          variant="secondary"
          className="finance-row-actions__btn"
          onClick={onEdit}
          title={t('common.edit')}
        >
          <Pencil size={14} />
          <span>{t('common.edit')}</span>
        </BaseButton>
      ) : null}
      {canToggle && onToggle ? (
        <BaseButton
          size="sm"
          variant="secondary"
          className="finance-row-actions__btn"
          onClick={onToggle}
          title={isActive ? t('common.disable') : t('common.enable')}
        >
          {isActive ? <PowerOff size={14} /> : <Power size={14} />}
          <span>{isActive ? t('common.disable') : t('common.enable')}</span>
        </BaseButton>
      ) : null}
      {canDelete && onDelete ? (
        <BaseButton
          size="sm"
          variant="danger"
          className="finance-row-actions__btn"
          onClick={onDelete}
          disabled={deletePending}
          title={t('common.delete')}
        >
          <Trash2 size={14} />
          <span>{t('common.delete')}</span>
        </BaseButton>
      ) : null}
    </div>
  );
}

import { Loader } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../components/ui';

export default function FinanceBulkConfirmModal({
  open,
  onClose,
  title,
  hint,
  note,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
  variant = 'danger',
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      className="finance-modal"
      bodyClassName="finance-modal__body"
      footer={(
        <div className="finance-form__actions finance-form__actions--modal-footer">
          <BaseButton variant="secondary" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </BaseButton>
          <BaseButton variant={variant} onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader size={14} className="animate-spin" /> : null}
            {confirmLabel}
          </BaseButton>
        </div>
      )}
    >
      <p className="finance-bulk-confirm__hint">{hint}</p>
      {note ? <p className="finance-bulk-confirm__note">{note}</p> : null}
    </BaseModal>
  );
}

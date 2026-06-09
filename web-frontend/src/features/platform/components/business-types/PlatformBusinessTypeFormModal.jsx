import { Save } from 'lucide-react';
import { BaseButton, BaseInput, BaseModal, inputCls } from '../../../../components/ui';

export default function PlatformBusinessTypeFormModal({
  t,
  modal,
  onClose,
  onFieldChange,
  onSave,
  saving,
}) {
  if (!modal) return null;

  const title = modal.mode === 'create' ? t('platform.businessTypes.addType') : t('common.edit');

  return (
    <BaseModal onClose={onClose} title={title} size="md">
      <div className="space-y-3">
        {modal.mode === 'create' ? (
          <BaseInput
            placeholder={t('platform.businessTypes.codePh')}
            value={modal.form.code}
            onChange={(e) => onFieldChange({ code: e.target.value.toUpperCase() })}
          />
        ) : null}
        <BaseInput
          placeholder={t('platform.businessTypes.namePh')}
          value={modal.form.name}
          onChange={(e) => onFieldChange({ name: e.target.value })}
        />
        <textarea
          className={inputCls}
          rows={3}
          placeholder={t('platform.businessTypes.descriptionPh')}
          value={modal.form.description}
          onChange={(e) => onFieldChange({ description: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={modal.form.active}
            onChange={(e) => onFieldChange({ active: e.target.checked })}
          />
          {t('platform.businessTypes.active')}
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <BaseButton variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </BaseButton>
        <BaseButton onClick={onSave} disabled={saving}>
          <Save size={14} />
          {t('common.save')}
        </BaseButton>
      </div>
    </BaseModal>
  );
}

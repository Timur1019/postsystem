import { ToggleLeft, ToggleRight } from 'lucide-react';
import { BaseButton, BaseInput, BaseModal, BaseSelect, inputCls } from '../../../../components/ui';
import { BUSINESS_TYPE_FIELD_TYPES } from '../../utils/businessTypeUtils';

export default function PlatformBusinessFieldFormModal({
  t,
  modal,
  form,
  onClose,
  onFieldChange,
  onSave,
  saving,
}) {
  if (!modal) return null;

  const title =
    modal.mode === 'create' ? t('platform.businessTypes.addField') : t('common.edit');

  return (
    <BaseModal onClose={onClose} title={title} size="lg">
      <div className="space-y-3">
        {modal.mode === 'create' ? (
          <BaseInput
            placeholder={t('platform.businessTypes.fieldKeyPh')}
            value={form.fieldKey}
            onChange={(e) => onFieldChange({ fieldKey: e.target.value })}
          />
        ) : null}
        <BaseInput
          placeholder={t('platform.businessTypes.fieldLabelPh')}
          value={form.label}
          onChange={(e) => onFieldChange({ label: e.target.value })}
        />
        <BaseSelect
          value={form.fieldType}
          onChange={(e) => onFieldChange({ fieldType: e.target.value })}
          options={BUSINESS_TYPE_FIELD_TYPES.map((type) => ({
            value: type,
            label: type,
          }))}
        />
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => onFieldChange({ required: e.target.checked })}
            />
            {t('platform.businessTypes.required')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => onFieldChange({ enabled: e.target.checked })}
            />
            {form.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {t('platform.businessTypes.enabled')}
          </label>
        </div>
        <BaseInput
          type="number"
          placeholder={t('platform.businessTypes.sortPh')}
          value={form.sortOrder}
          onChange={(e) => onFieldChange({ sortOrder: e.target.value })}
        />
        <BaseInput
          placeholder={t('platform.businessTypes.placeholderPh')}
          value={form.placeholder}
          onChange={(e) => onFieldChange({ placeholder: e.target.value })}
        />
        {form.fieldType === 'LIST' ? (
          <textarea
            className={inputCls}
            rows={4}
            placeholder={t('platform.businessTypes.optionsPh')}
            value={form.optionsText}
            onChange={(e) => onFieldChange({ optionsText: e.target.value })}
          />
        ) : null}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <BaseButton variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </BaseButton>
        <BaseButton onClick={onSave} disabled={saving}>
          {t('common.save')}
        </BaseButton>
      </div>
    </BaseModal>
  );
}

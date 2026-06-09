import { useTranslation } from 'react-i18next';
import { BaseButton, BaseInput, BaseModal, inputCls } from '../../../components/ui';

export default function PlatformCompanyFormModal({
  open,
  editing,
  form,
  isSaving,
  businessTypes,
  onClose,
  onFieldChange,
  onSave,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <BaseModal
      title={editing ? t('platform.editCompany') : t('platform.addCompany')}
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            disabled={!form.name.trim() || isSaving}
            onClick={onSave}
          >
            {t('common.save')}
          </BaseButton>
        </>
      )}
    >
      {!editing ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          {t('platform.field_loginCodeAutoHint')}
        </p>
      ) : (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500">{t('platform.field_loginCode')}</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-slate-900 dark:text-white">
            {editing.loginCode || '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('platform.field_loginCodeReadonly')}</p>
        </div>
      )}

      {['name', 'legalName', 'tin', 'phone'].map((field) => (
        <BaseInput
          key={field}
          className="mb-3"
          label={t(`platform.field_${field}`)}
          value={form[field]}
          onChange={(e) => onFieldChange(field, e.target.value)}
        />
      ))}

      <BaseInput
        as="textarea"
        rows={2}
        className="mb-3"
        label={t('platform.field_address')}
        value={form.address}
        onChange={(e) => onFieldChange('address', e.target.value)}
      />

      <div className="mb-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('platform.field_businessType')}
        </label>
        <select
          className={inputCls}
          value={form.businessType}
          onChange={(e) => onFieldChange('businessType', e.target.value)}
        >
          {businessTypes.map((bt) => (
            <option key={bt.code} value={bt.code}>
              {t(`productTemplates.businessTypes.${bt.code}`)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">{t('platform.field_businessTypeHint')}</p>
      </div>
    </BaseModal>
  );
}

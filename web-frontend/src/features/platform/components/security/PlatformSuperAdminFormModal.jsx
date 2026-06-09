import { BaseButton, BaseModal, BaseInput } from '../../../../components/ui';

export default function PlatformSuperAdminFormModal({
  t,
  form,
  onClose,
  onSubmit,
  onFieldChange,
  saving,
}) {
  if (!form) return null;

  const title =
    form.mode === 'create'
      ? t('platform.security.addSuperAdmin')
      : t('platform.security.editSuperAdmin');

  return (
    <BaseModal onClose={onClose} title={title} size="md">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <BaseInput
            label={t('platform.security.colFirstName')}
            value={form.firstName}
            onChange={(e) => onFieldChange('firstName', e.target.value)}
            required
          />
          <BaseInput
            label={t('platform.security.colLastName')}
            value={form.lastName}
            onChange={(e) => onFieldChange('lastName', e.target.value)}
            required
          />
        </div>
        {form.mode === 'create' ? (
          <>
            <BaseInput
              label={t('platform.security.colUsername')}
              value={form.username}
              onChange={(e) => onFieldChange('username', e.target.value)}
              required
            />
            <BaseInput
              label={t('platform.security.colEmail')}
              type="email"
              value={form.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              required
            />
          </>
        ) : null}
        <BaseInput
          label={
            form.mode === 'create'
              ? t('platform.security.colPassword')
              : t('platform.security.newPasswordOptional')
          }
          type="password"
          value={form.password}
          onChange={(e) => onFieldChange('password', e.target.value)}
          required={form.mode === 'create'}
          minLength={form.mode === 'create' ? 6 : undefined}
        />
        <div className="flex gap-3 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="submit" className="flex-1" disabled={saving}>
            {t('common.save')}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}

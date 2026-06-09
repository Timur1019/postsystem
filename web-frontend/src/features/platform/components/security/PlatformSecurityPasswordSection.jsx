import { KeyRound } from 'lucide-react';
import { BaseButton, inputCls } from '../../../../components/ui';

export default function PlatformSecurityPasswordSection({
  t,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
  passwordStatus,
  passwordLoading,
  onSubmit,
  saving,
}) {
  return (
    <section className="platform-security__card">
      <div className="platform-security__card-head">
        <KeyRound size={18} className="text-emerald-600" />
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('platform.security.cashierPasswordTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('platform.security.cashierPasswordHint')}
          </p>
        </div>
      </div>
      <p className="platform-security__note">{t('platform.security.cashierPasswordDefault')}</p>
      {passwordLoading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('platform.security.newPassword')}
            </label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('platform.security.confirmPassword')}
            </label>
            <input
              type="password"
              className={inputCls}
              value={passwordConfirm}
              onChange={(e) => onPasswordConfirmChange(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <span className="text-xs text-slate-500">
              {passwordStatus?.updatedAt
                ? t('platform.security.passwordUpdatedAt', { date: passwordStatus.updatedAt })
                : null}
            </span>
            <BaseButton type="submit" disabled={saving}>
              {t('platform.security.savePassword')}
            </BaseButton>
          </div>
        </form>
      )}
    </section>
  );
}

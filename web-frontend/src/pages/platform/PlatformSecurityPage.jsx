import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Shield, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformSecurityApi } from '../../services/api';
import '../../styles/platform-security.css';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
  focus:outline-none focus:ring-2 focus:ring-emerald-500
  dark:border-slate-700 dark:bg-slate-900 dark:text-white`;

export default function PlatformSecurityPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [adminForm, setAdminForm] = useState(null);

  const { data: passwordStatus, isLoading: passwordLoading } = useQuery({
    queryKey: ['platform-security-password'],
    queryFn: () => platformSecurityApi.getCashierServerPassword().then((r) => r.data),
  });

  const { data: superAdmins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['platform-security-super-admins'],
    queryFn: () => platformSecurityApi.listSuperAdmins().then((r) => r.data),
  });

  const passwordMutation = useMutation({
    mutationFn: (value) => platformSecurityApi.updateCashierServerPassword(value).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('platform.security.passwordSaved'));
      setPassword('');
      setPasswordConfirm('');
      qc.invalidateQueries({ queryKey: ['platform-security-password'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.security.passwordSaveFailed')),
  });

  const createAdminMutation = useMutation({
    mutationFn: (payload) => platformSecurityApi.createSuperAdmin(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('platform.security.adminCreated'));
      setAdminForm(null);
      qc.invalidateQueries({ queryKey: ['platform-security-super-admins'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.security.adminSaveFailed')),
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({ id, payload }) => platformSecurityApi.updateSuperAdmin(id, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('platform.security.adminUpdated'));
      setAdminForm(null);
      qc.invalidateQueries({ queryKey: ['platform-security-super-admins'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.security.adminSaveFailed')),
  });

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (password.length < 4) {
      toast.error(t('platform.security.passwordTooShort'));
      return;
    }
    if (password !== passwordConfirm) {
      toast.error(t('platform.security.passwordMismatch'));
      return;
    }
    passwordMutation.mutate(password);
  };

  const openCreateAdmin = () => {
    setAdminForm({
      mode: 'create',
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
    });
  };

  const openEditAdmin = (row) => {
    setAdminForm({
      mode: 'edit',
      id: row.id,
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      password: '',
    });
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (!adminForm) return;
    if (adminForm.mode === 'create') {
      createAdminMutation.mutate({
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        username: adminForm.username.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
      });
      return;
    }
    updateAdminMutation.mutate({
      id: adminForm.id,
      payload: {
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        password: adminForm.password || undefined,
      },
    });
  };

  return (
    <div className="platform-security space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('platform.security.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('platform.security.subtitle')}</p>
      </div>

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
          <form onSubmit={handlePasswordSave} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('platform.security.newPassword')}
              </label>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {passwordStatus?.updatedAt
                  ? t('platform.security.passwordUpdatedAt', { date: passwordStatus.updatedAt })
                  : null}
              </span>
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {t('platform.security.savePassword')}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="platform-security__card">
        <div className="platform-security__card-head">
          <Shield size={18} className="text-emerald-600" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('platform.security.superAdminsTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('platform.security.superAdminsHint')}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateAdmin}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <UserPlus size={16} />
            {t('platform.security.addSuperAdmin')}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-3">{t('platform.security.colName')}</th>
                <th className="px-4 py-3">{t('platform.security.colLogin')}</th>
                <th className="px-4 py-3">{t('platform.security.colEmail')}</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {adminsLoading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">{t('common.loading')}</td></tr>
              ) : superAdmins.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">{t('platform.security.emptyAdmins')}</td></tr>
              ) : superAdmins.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.fullName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.username}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.email}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditAdmin(row)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {adminForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {adminForm.mode === 'create'
                ? t('platform.security.addSuperAdmin')
                : t('platform.security.editSuperAdmin')}
            </h3>
            <form onSubmit={handleAdminSubmit} className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{t('platform.security.colFirstName')}</label>
                  <input
                    className={inputCls}
                    value={adminForm.firstName}
                    onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{t('platform.security.colLastName')}</label>
                  <input
                    className={inputCls}
                    value={adminForm.lastName}
                    onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              {adminForm.mode === 'create' ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">{t('platform.security.colUsername')}</label>
                    <input
                      className={inputCls}
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">{t('platform.security.colEmail')}</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      required
                    />
                  </div>
                </>
              ) : null}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {adminForm.mode === 'create' ? t('platform.security.colPassword') : t('platform.security.newPasswordOptional')}
                </label>
                <input
                  type="password"
                  className={inputCls}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required={adminForm.mode === 'create'}
                  minLength={adminForm.mode === 'create' ? 6 : undefined}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminForm(null)}
                  className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
                  className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

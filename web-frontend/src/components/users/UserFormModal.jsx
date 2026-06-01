// src/components/users/UserFormModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Loader } from 'lucide-react';
import { companyApi, storeApi, userApi } from '../../services/api';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
  focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

function toStoreIdSet(ids) {
  const list = Array.isArray(ids) ? ids : [];
  return new Set(list.map((id) => Number(id)).filter((n) => !Number.isNaN(n)));
}

function cashierStoreSet(ids) {
  const arr = Array.from(toStoreIdSet(ids));
  return arr.length > 0 ? new Set([arr[0]]) : new Set();
}

function asStoreList(data) {
  return Array.isArray(data) ? data : [];
}

/**
 * @param {'create' | 'edit'} mode
 * @param {object} [editingUser] — row user when mode === 'edit'
 */
export default function UserFormModal({ open, onClose, isPlatform, mode, editingUser }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = mode === 'edit';
  const user = isEdit ? editingUser : null;

  const [storeIds, setStoreIds] = useState(() => new Set());
  const [companyId, setCompanyId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: isPlatform ? 'ADMIN' : 'MANAGER',
      firstName: '',
      lastName: '',
      patronymic: '',
      username: '',
      email: '',
      pin: '',
      password: '',
    },
  });

  const selectedRole = watch('role');
  const isCashierRole = selectedRole === 'CASHIER';
  const fieldOn = useTenantDisplayStore((s) => s.isUserFormFieldOn);
  const pinRequired = !isEdit || (isCashierRole && user?.role !== 'CASHIER');
  const showPasswordField = !isCashierRole && (fieldOn('password') || !isEdit);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled: isPlatform && open,
  });

  const { data: storesRaw } = useQuery({
    queryKey: ['stores', 'user-form'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: open,
  });

  const stores = asStoreList(storesRaw);

  const filteredStores = useMemo(() => {
    if (!isPlatform || !companyId) return stores;
    return stores.filter((s) => String(s.companyId) === String(companyId));
  }, [stores, companyId, isPlatform]);

  const storeOptions = useMemo(() => {
    const base = (isPlatform ? filteredStores : stores).filter((s) => s.active !== false);
    if (!isEdit || !user) return base;

    const assignedIds = Array.isArray(user.storeIds) ? user.storeIds : [];
    if (assignedIds.length === 0) return base;

    const known = new Set(base.map((s) => Number(s.id)));
    const names = Array.isArray(user.storeNames) ? user.storeNames : [];
    const extras = assignedIds
      .map((id, idx) => ({
        id: Number(id),
        name: names[idx] ?? `#${id}`,
        active: false,
      }))
      .filter((s) => !Number.isNaN(s.id) && !known.has(s.id));

    return [...base, ...extras];
  }, [isPlatform, filteredStores, stores, isEdit, user]);

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      if (!user?.id) return;
      const role = user.role ?? 'MANAGER';
      const initialStores = toStoreIdSet(user.storeIds);
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        patronymic: user.patronymic ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        role,
        pin: '',
        password: '',
      });
      setStoreIds(role === 'CASHIER' ? cashierStoreSet(initialStores) : initialStores);
      setCompanyId(user.companyId != null ? String(user.companyId) : '');
    } else {
      reset({
        role: isPlatform ? 'ADMIN' : 'MANAGER',
        firstName: '',
        lastName: '',
        patronymic: '',
        username: '',
        email: '',
        pin: '',
        password: '',
      });
      setStoreIds(new Set());
      setCompanyId('');
    }
  }, [open, isEdit, user, isPlatform, reset]);

  useEffect(() => {
    if (!isCashierRole) return;
    setStoreIds((prev) => (prev.size > 1 ? cashierStoreSet(prev) : prev));
  }, [isCashierRole]);

  const { mutate: saveUser, isPending } = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        if (!user?.id) return Promise.reject(new Error('User id missing'));
        return userApi.update(user.id, payload).then((r) => r.data);
      }
      return userApi.create(payload).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(isEdit ? t('users.updated') : t('users.created'));
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? (isEdit ? t('users.updateFailed') : t('users.createFailed'))),
  });

  const toggleStore = (id) => {
    const storeId = Number(id);
    if (Number.isNaN(storeId)) return;
    if (isCashierRole) {
      setStoreIds(new Set([storeId]));
      return;
    }
    setStoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const onSubmit = (data) => {
    const role = data.role;
    const username = data.username?.trim() ?? '';
    const pin = String(data.pin ?? '').trim();
    const firstName = fieldOn('firstName') ? data.firstName?.trim() : username;
    const lastName = fieldOn('lastName') ? data.lastName?.trim() : '—';
    const patronymic = fieldOn('patronymic') ? data.patronymic?.trim() || null : null;
    const email = fieldOn('email') ? data.email.trim() : `${username}@local.pos`;
    let selectedStoreIds = Array.from(storeIds).map(Number).filter((n) => !Number.isNaN(n));

    if (role === 'CASHIER') {
      if (selectedStoreIds.length === 0) {
        toast.error(t('users.cashierStoreRequired'));
        return;
      }
      if (selectedStoreIds.length > 1) {
        selectedStoreIds = [selectedStoreIds[0]];
      }
      if (!pinRequired && pin && pin.replace(/\D/g, '').length > 0 && pin.replace(/\D/g, '').length < 4) {
        toast.error(t('users.pinRequired', { defaultValue: 'PIN обязателен (4–6 цифр)' }));
        return;
      }
      if (pinRequired && (!pin || pin.replace(/\D/g, '').length < 4)) {
        toast.error(t('users.pinRequired', { defaultValue: 'PIN обязателен (4–6 цифр)' }));
        return;
      }
    } else if (!isEdit) {
      const pwd = String(data.password || '').trim();
      if (pwd.length < 6) {
        toast.error(t('users.passwordMinLength'));
        return;
      }
    }

    if (!username) {
      toast.error(t('validation.required'));
      return;
    }

    if (isEdit) {
      const newPassword = data.password?.trim() ?? '';
      if (newPassword.length > 0 && newPassword.length < 6) {
        toast.error(t('users.passwordMinLength'));
        return;
      }
      const payload = {
        username,
        ...(pin ? { pin } : {}),
        firstName,
        lastName,
        patronymic,
        email,
        role,
        companyId: isPlatform && companyId ? Number(companyId) : undefined,
        storeIds: selectedStoreIds,
      };
      if (newPassword.length >= 6) {
        payload.password = newPassword;
      }
      saveUser(payload);
      return;
    }

    saveUser({
      firstName,
      lastName,
      patronymic,
      username,
      email,
      pin: role === 'CASHIER' ? pin : undefined,
      password: role === 'CASHIER' ? undefined : data.password,
      role,
      companyId: isPlatform && companyId ? Number(companyId) : undefined,
      storeIds: selectedStoreIds,
    });
  };

  if (!open) return null;

  if (isEdit && !user?.id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="rounded-xl bg-white p-6 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const fioFields = [
    { name: 'lastName', label: t('users.lastName'), key: 'lastName' },
    { name: 'firstName', label: t('users.firstName'), key: 'firstName' },
    { name: 'patronymic', label: t('users.patronymic'), key: 'patronymic' },
  ].filter((f) => fieldOn(f.key));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b p-5 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? t('users.editUser') : t('users.newUser')}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          {fioFields.map(({ name, label }) => (
            <div key={name}>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{label} *</label>
              <input {...register(name, { required: true })} className={inputCls} />
              {errors[name] && <p className="mt-1 text-xs text-red-400">{t('validation.required')}</p>}
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t('users.colUsername')} *</label>
            <input
              {...register('username', { required: true })}
              autoComplete="username"
              className={inputCls}
            />
            {errors.username && <p className="mt-1 text-xs text-red-400">{t('validation.required')}</p>}
          </div>
          {isCashierRole ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                {t('users.pin', { defaultValue: 'PIN-код кассира' })}
                {pinRequired ? ' *' : ''}
              </label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••"
                {...register('pin', { required: pinRequired })}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {pinRequired
                  ? t('users.pinHint', { defaultValue: '4–6 цифр. Используется для входа кассира и разблокировки.' })
                  : t('users.pinEditHint', { defaultValue: 'Оставьте пустым, если менять PIN не нужно' })}
              </p>
            </div>
          ) : null}
          {fieldOn('email') ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t('users.email')} *</label>
              <input type="email" {...register('email', { required: true })} className={inputCls} />
            </div>
          ) : null}
          {showPasswordField ? (
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {t('users.password')}
              {!isEdit ? ' *' : ''}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder={isEdit ? t('users.passwordEditPlaceholder') : undefined}
              {...register('password', isEdit ? {} : { required: true, minLength: 6 })}
              className={inputCls}
            />
            {isEdit && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('users.passwordEditHint')}</p>
            )}
            {!isEdit && errors.password && (
              <p className="mt-1 text-xs text-red-400">{t('users.passwordMinLength')}</p>
            )}
          </div>
          ) : null}
          {isPlatform && (
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t('users.colCompany')} *</label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  if (!isEdit) setStoreIds(new Set());
                }}
                className={inputCls}
                disabled={isEdit}
              >
                <option value="">{t('stores.selectCompany')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {fieldOn('role') ? (
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t('users.role')}</label>
            <select {...register('role')} className={inputCls}>
              {isPlatform ? (
                <>
                  <option value="ADMIN">{t('users.roleAdmin')}</option>
                  <option value="MANAGER">{t('users.roleManager')}</option>
                  <option value="CASHIER">{t('users.roleCashier')}</option>
                </>
              ) : (
                <>
                  <option value="MANAGER">{t('users.roleManager')}</option>
                  <option value="CASHIER">{t('users.roleCashier')}</option>
                </>
              )}
            </select>
          </div>
          ) : null}
          {fieldOn('stores') ? (
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('users.colStores')}</label>
            {isCashierRole && (
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{t('users.cashierStoreHint')}</p>
            )}
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3 dark:border-slate-700">
              {storeOptions.length === 0 ? (
                <p className="text-xs text-slate-500">{t('users.noStoresAvailable')}</p>
              ) : (
                storeOptions.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type={isCashierRole ? 'radio' : 'checkbox'}
                      name={isCashierRole ? `cashier-store-${user?.id ?? 'new'}` : undefined}
                      checked={storeIds.has(Number(s.id))}
                      onChange={() => toggleStore(s.id)}
                    />
                    <span className={s.active === false ? 'text-amber-600 dark:text-amber-400' : ''}>
                      {s.name}
                      {s.active === false ? ` (${t('users.storeInactive')})` : ''}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          ) : null}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2.5 dark:border-slate-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-emerald-500 py-2.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {isPending && <Loader size={14} className="mr-1 inline animate-spin" />}
              {isEdit ? t('common.save') : t('users.createUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi, storeApi, userApi } from '../../../api';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { useTenantScope } from '../../../hooks/useTenantScope';
import {
  asStoreList,
  cashierStoreSet,
  toStoreIdSet,
} from '../utils/userFormModalUtils';

export function useUserFormModal({ open, onClose, isPlatform, mode, editingUser }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { tenantKey, tenantReady } = useTenantScope();
  const isEdit = mode === 'edit';
  const user = isEdit ? editingUser : null;

  const [storeIds, setStoreIds] = useState(() => new Set());
  const [companyId, setCompanyId] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const createCredentialsRef = useRef(null);

  const form = useForm({
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

  const { register, handleSubmit, reset, watch, formState: { errors } } = form;
  const selectedRole = watch('role');
  const isCashierRole = selectedRole === 'CASHIER';
  const fieldOn = useTenantDisplayStore((s) => s.isUserFormFieldOn);
  const pinRequired = !isEdit || (isCashierRole && user?.role !== 'CASHIER');
  const showPasswordField = !isCashierRole && (isPlatform || fieldOn('password') || !isEdit);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled: isPlatform && open,
  });

  const { data: storesRaw } = useQuery({
    queryKey: isPlatform ? ['stores', 'platform-user-form', companyId || 'none'] : tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: open && (isPlatform ? Boolean(companyId) : tenantReady),
  });

  const stores = asStoreList(storesRaw);

  const selectedCompany = useMemo(() => {
    if (!isPlatform) return null;
    const id = isEdit ? user?.companyId : companyId ? Number(companyId) : null;
    if (!id) return null;
    return companies.find((c) => Number(c.id) === Number(id)) ?? null;
  }, [isPlatform, isEdit, user?.companyId, companyId, companies]);

  const companyLoginCode =
    (isEdit ? user?.companyLoginCode : selectedCompany?.loginCode) || null;

  const filteredStores = useMemo(() => {
    if (!isPlatform) return stores;
    if (!companyId) return [];
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
    if (!open) {
      setPasswordVisible(false);
      return;
    }

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
      if (!isEdit && isPlatform && createCredentialsRef.current) {
        setCreatedCredentials(createCredentialsRef.current);
        createCredentialsRef.current = null;
        onClose();
        return;
      }
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
      if (pinRequired && (!pin || pin.replace(/\D/g, '').length < 4)) {
        toast.error(t('users.pinRequired', { defaultValue: 'PIN обязателен (4–6 цифр)' }));
        return;
      }
      if (!pinRequired && pin && pin.replace(/\D/g, '').length > 0 && pin.replace(/\D/g, '').length < 4) {
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
    if (isPlatform) {
      createCredentialsRef.current = {
        username,
        password: role === 'CASHIER' ? null : String(data.password || '').trim(),
        pin: role === 'CASHIER' ? pin : null,
        role,
        companyLoginCode,
      };
    }
  };

  const fioFields = [
    { name: 'lastName', label: t('users.lastName'), key: 'lastName' },
    { name: 'firstName', label: t('users.firstName'), key: 'firstName' },
    { name: 'patronymic', label: t('users.patronymic'), key: 'patronymic' },
  ].filter((f) => fieldOn(f.key));

  const dismissCredentials = () => {
    setCreatedCredentials(null);
    toast.success(t('users.created'));
  };

  return {
    t,
    open,
    onClose,
    isPlatform,
    isEdit,
    user,
    isCashierRole,
    pinRequired,
    showPasswordField,
    fieldOn,
    companies,
    companyId,
    setCompanyId,
    setStoreIds,
    companyLoginCode,
    passwordVisible,
    setPasswordVisible,
    createdCredentials,
    dismissCredentials,
    register,
    handleSubmit,
    errors,
    onSubmit,
    isPending,
    storeIds,
    toggleStore,
    storeOptions,
    fioFields,
  };
}

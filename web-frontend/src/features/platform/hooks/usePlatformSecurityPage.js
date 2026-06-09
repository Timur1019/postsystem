import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformSecurityApi } from '../../../api';

const emptyAdminForm = () => ({
  mode: 'create',
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
});

export function usePlatformSecurityPage() {
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

  const openCreateAdmin = () => setAdminForm(emptyAdminForm());

  const openEditAdmin = (row) => {
    setAdminForm({
      mode: 'edit',
      id: row.id,
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      password: '',
    });
  };

  const closeAdminForm = () => setAdminForm(null);

  const updateAdminField = (field, value) => {
    setAdminForm((prev) => (prev ? { ...prev, [field]: value } : prev));
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

  const adminSaving = createAdminMutation.isPending || updateAdminMutation.isPending;

  return {
    t,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    passwordStatus,
    passwordLoading,
    passwordMutation,
    handlePasswordSave,
    superAdmins,
    adminsLoading,
    adminForm,
    openCreateAdmin,
    openEditAdmin,
    closeAdminForm,
    updateAdminField,
    handleAdminSubmit,
    adminSaving,
  };
}

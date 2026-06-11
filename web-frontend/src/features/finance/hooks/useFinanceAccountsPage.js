import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { financeBulkRun } from '../utils/financeBulkRun';
import { useFinanceRowSelection } from './useFinanceRowSelection';

const ACCOUNT_TYPES = ['CASH', 'BANK', 'CARD', 'CLICK', 'PAYME', 'UZUM', 'OTHER'];

export function useFinanceAccountsPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [bulkDisableOpen, setBulkDisableOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'BANK', currency: 'UZS', initialBalance: '' });
  const [editForm, setEditForm] = useState({ name: '', type: 'BANK', active: true });

  const query = useQuery({
    queryKey: tenantKey('finance-accounts'),
    queryFn: () => financeApi.accounts.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const allRows = query.data ?? [];
  const selection = useFinanceRowSelection(allRows);
  const selectedActive = useMemo(
    () => selection.selectedRows.filter((r) => r.active !== false),
    [selection.selectedRows],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => financeApi.accounts.create(payload),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setForm({ name: '', type: 'BANK', currency: 'UZS', initialBalance: '' });
      toast.success(t('finance.accounts.created'));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => financeApi.accounts.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditModal(null);
      toast.success(t('finance.accounts.updated'));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const bulkDisableMutation = useMutation({
    mutationFn: (rows) => financeBulkRun(rows, (row) => financeApi.accounts.update(row.id, {
      name: row.name,
      type: row.type,
      active: false,
    })),
    onSuccess: ({ succeeded, failed }) => {
      invalidate();
      selection.clearSelection();
      setBulkDisableOpen(false);
      if (failed > 0) toast.error(t('finance.bulk.partialFail', { succeeded, failed }));
      else toast.success(t('finance.bulk.disableSuccess', { count: succeeded }));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('finance.bulk.disableFailed')),
  });

  const submit = () => {
    createMutation.mutate({
      name: form.name.trim(),
      type: form.type,
      currency: form.currency,
      initialBalance: form.initialBalance ? Number(form.initialBalance) : 0,
    });
  };

  const openEdit = (account) => {
    setEditForm({
      name: account.name ?? '',
      type: account.type ?? 'BANK',
      active: account.active !== false,
    });
    setEditModal(account);
  };

  const submitEdit = () => {
    if (!editModal) return;
    updateMutation.mutate({
      id: editModal.id,
      payload: {
        name: editForm.name.trim(),
        type: editForm.type,
        active: editForm.active,
      },
    });
  };

  const toggleActive = (account) => {
    updateMutation.mutate({
      id: account.id,
      payload: {
        name: account.name,
        type: account.type,
        active: !(account.active !== false),
      },
    });
  };

  const confirmBulkDisable = () => {
    bulkDisableMutation.mutate(selectedActive);
  };

  return {
    t,
    query,
    allRows,
    selection,
    selectedActive,
    modalOpen,
    setModalOpen,
    editModal,
    setEditModal,
    bulkDisableOpen,
    setBulkDisableOpen,
    form,
    setForm,
    editForm,
    setEditForm,
    openEdit,
    toggleActive,
    submit,
    submitEdit,
    confirmBulkDisable,
    createMutation,
    updateMutation,
    bulkDisableMutation,
    accountTypes: ACCOUNT_TYPES,
  };
}

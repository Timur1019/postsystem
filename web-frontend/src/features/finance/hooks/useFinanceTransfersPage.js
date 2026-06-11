import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useFinanceDateFilters } from './useFinanceDateFilters';
import { useFinanceListPagination } from './useFinanceListPagination';

export function useFinanceTransfersPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, setPageSize } = useFinanceListPagination(20);
  const filters = useFinanceDateFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    comment: '',
  });

  useEffect(() => {
    setPage(0);
  }, [filters.from, filters.to, setPage]);

  const accountsQuery = useQuery({
    queryKey: tenantKey('finance-accounts'),
    queryFn: () => financeApi.accounts.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const transfersQuery = useQuery({
    queryKey: tenantKey('finance-transfers', page, pageSize, filters.queryParams),
    queryFn: () => financeApi.transfers.list({ page, size: pageSize, ...filters.queryParams }).then((r) => r.data),
    enabled: tenantReady,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => financeApi.transfers.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-transfers') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
      setModalOpen(false);
      setForm({ fromAccountId: '', toAccountId: '', amount: '', comment: '' });
    },
  });

  const submit = () => {
    createMutation.mutate({
      fromAccountId: form.fromAccountId,
      toAccountId: form.toAccountId,
      amount: Number(form.amount),
      comment: form.comment || undefined,
    });
  };

  const accounts = (accountsQuery.data ?? []).filter((a) => a.active);

  return {
    t,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    accountsQuery,
    transfersQuery,
    accounts,
    modalOpen,
    setModalOpen,
    form,
    setForm,
    submit,
    createMutation,
  };
}

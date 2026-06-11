import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { financeBulkRun } from '../utils/financeBulkRun';
import { isEditableIncome } from '../utils/financeRowRules';
import { useFinanceDateFilters } from './useFinanceDateFilters';
import { useFinanceListPagination } from './useFinanceListPagination';
import { useFinanceRowSelection } from './useFinanceRowSelection';

export function useFinanceIncomesPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, setPageSize } = useFinanceListPagination(20);
  const filters = useFinanceDateFilters({ withPaymentMethod: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    accountId: '',
    incomeCategoryId: '',
    paymentMethod: 'CASH',
    comment: '',
    transactionDate: '',
  });

  useEffect(() => {
    setPage(0);
  }, [filters.from, filters.to, filters.paymentMethod, setPage]);

  const incomesQuery = useQuery({
    queryKey: tenantKey('finance-incomes', page, pageSize, filters.queryParams),
    queryFn: () => financeApi.incomes.list({ page, size: pageSize, ...filters.queryParams }).then((r) => r.data),
    enabled: tenantReady,
  });

  const rows = incomesQuery.data?.content ?? [];
  const selection = useFinanceRowSelection(rows, {
    resetKey: `${page}-${pageSize}-${filters.from}-${filters.to}-${filters.paymentMethod}`,
  });
  const selectableRows = useMemo(() => rows.filter(isEditableIncome), [rows]);
  const selectedDeletable = useMemo(
    () => selection.selectedRows.filter(isEditableIncome),
    [selection.selectedRows],
  );

  const accountsQuery = useQuery({
    queryKey: tenantKey('finance-accounts'),
    queryFn: () => financeApi.accounts.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const categoriesQuery = useQuery({
    queryKey: tenantKey('finance-income-categories'),
    queryFn: () => financeApi.categories.income().then((r) => r.data),
    enabled: tenantReady,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-incomes') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
  };

  const resetForm = () => {
    setForm({ amount: '', accountId: '', incomeCategoryId: '', paymentMethod: 'CASH', comment: '', transactionDate: '' });
    setEditingId(null);
  };

  const createMutation = useMutation({
    mutationFn: (payload) => financeApi.incomes.create(payload),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      resetForm();
      toast.success(t('finance.incomes.created'));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => financeApi.incomes.update(id, payload),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      resetForm();
      toast.success(t('finance.incomes.updated'));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => financeApi.incomes.delete(id),
    onSuccess: invalidate,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (rows) => financeBulkRun(rows, (row) => financeApi.incomes.delete(row.id)),
    onSuccess: ({ succeeded, failed }) => {
      invalidate();
      selection.clearSelection();
      setBulkDeleteOpen(false);
      setDeleteTarget(null);
      if (failed > 0) toast.error(t('finance.bulk.partialFail', { succeeded, failed }));
      else toast.success(t('finance.bulk.deleteSuccess', { count: succeeded }));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('finance.bulk.deleteFailed')),
  });

  const openEdit = (row) => {
    if (!isEditableIncome(row)) return;
    setEditingId(row.id);
    setForm({
      amount: String(row.amount ?? ''),
      accountId: row.accountId ?? '',
      incomeCategoryId: row.incomeCategoryId ?? '',
      paymentMethod: row.paymentMethod ?? 'CASH',
      comment: row.comment ?? '',
      transactionDate: row.transactionDate ?? '',
    });
    setModalOpen(true);
  };

  const submit = () => {
    const payload = {
      amount: Number(form.amount),
      accountId: form.accountId,
      incomeCategoryId: form.incomeCategoryId,
      paymentMethod: form.paymentMethod,
      comment: form.comment || undefined,
      transactionDate: form.transactionDate || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate({ ...payload, sourceType: 'MANUAL' });
  };

  const openDelete = (row) => {
    if (!isEditableIncome(row)) return;
    setDeleteTarget(row);
  };

  const confirmDelete = () => {
    if (bulkDeleteOpen && selectedDeletable.length > 0) {
      bulkDeleteMutation.mutate(selectedDeletable);
      return;
    }
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => {
          toast.success(t('finance.bulk.deleteSuccess', { count: 1 }));
          setDeleteTarget(null);
        },
        onError: (err) => toast.error(err.response?.data?.message ?? t('finance.bulk.deleteFailed')),
      });
    }
  };

  const toggleSelectAllEditable = () => {
    const ids = selectableRows.map((r) => r.id);
    const allSelected = ids.length > 0 && ids.every((id) => selection.selectedIds.has(id));
    selection.setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const allSelectableSelected = selectableRows.length > 0
    && selectableRows.every((r) => selection.selectedIds.has(r.id));

  return {
    t,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    incomesQuery,
    accountsQuery,
    categoriesQuery,
    rows,
    selection,
    selectableRows,
    selectedDeletable,
    allSelectableSelected,
    toggleSelectAllEditable,
    modalOpen,
    setModalOpen,
    editingId,
    form,
    setForm,
    openEdit,
    openDelete,
    confirmDelete,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    deleteTarget,
    setDeleteTarget,
    submit,
    createMutation,
    updateMutation,
    bulkDeleteMutation,
    isEditable: isEditableIncome,
    resetForm,
  };
}

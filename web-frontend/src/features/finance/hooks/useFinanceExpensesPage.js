import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { financeApi, userApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { financeBulkRun } from '../utils/financeBulkRun';
import { isEditableExpense } from '../utils/financeRowRules';
import { useFinanceDateFilters } from './useFinanceDateFilters';
import { useFinanceListPagination } from './useFinanceListPagination';
import { useFinanceRowSelection } from './useFinanceRowSelection';

export function useFinanceExpensesPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, setPageSize } = useFinanceListPagination(20);
  const filters = useFinanceDateFilters({ withCategory: true, withPaymentMethod: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    accountId: '',
    expenseCategoryId: '',
    paymentMethod: 'CASH',
    employeeId: '',
    comment: '',
    transactionDate: '',
  });

  useEffect(() => {
    setPage(0);
  }, [filters.from, filters.to, filters.categoryId, filters.paymentMethod, setPage]);

  const expensesQuery = useQuery({
    queryKey: tenantKey('finance-expenses', page, pageSize, filters.queryParams),
    queryFn: () => financeApi.expenses.list({ page, size: pageSize, ...filters.queryParams }).then((r) => r.data),
    enabled: tenantReady,
  });

  const rows = expensesQuery.data?.content ?? [];
  const selection = useFinanceRowSelection(rows, {
    resetKey: `${page}-${pageSize}-${filters.from}-${filters.to}-${filters.categoryId}-${filters.paymentMethod}`,
  });

  const selectableRows = useMemo(() => rows.filter(isEditableExpense), [rows]);
  const selectedDeletable = useMemo(
    () => selection.selectedRows.filter(isEditableExpense),
    [selection.selectedRows],
  );

  const accountsQuery = useQuery({
    queryKey: tenantKey('finance-accounts'),
    queryFn: () => financeApi.accounts.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const categoriesQuery = useQuery({
    queryKey: tenantKey('finance-expense-categories'),
    queryFn: () => financeApi.categories.expense().then((r) => r.data),
    enabled: tenantReady,
  });

  const usersQuery = useQuery({
    queryKey: tenantKey('finance-users'),
    queryFn: () => userApi.getAll().then((r) => r.data),
    enabled: tenantReady && modalOpen,
  });

  const resetForm = () => {
    setForm({
      amount: '',
      accountId: '',
      expenseCategoryId: '',
      paymentMethod: 'CASH',
      employeeId: '',
      comment: '',
      transactionDate: '',
    });
    setEditingId(null);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-expenses') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => financeApi.expenses.create(payload),
    onSuccess: () => {
      invalidate();
      setPage(0);
      setModalOpen(false);
      resetForm();
      toast.success(t('finance.expenses.created'));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => financeApi.expenses.update(id, payload),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      resetForm();
      toast.success(t('finance.expenses.updated'));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => financeApi.expenses.delete(id),
    onSuccess: invalidate,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (rows) => financeBulkRun(rows, (row) => financeApi.expenses.delete(row.id)),
    onSuccess: ({ succeeded, failed }) => {
      invalidate();
      selection.clearSelection();
      setBulkDeleteOpen(false);
      setDeleteTarget(null);
      if (failed > 0) {
        toast.error(t('finance.bulk.partialFail', { succeeded, failed }));
      } else {
        toast.success(t('finance.bulk.deleteSuccess', { count: succeeded }));
      }
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('finance.bulk.deleteFailed')),
  });

  const selectedCategory = (categoriesQuery.data ?? []).find(
    (c) => String(c.id) === String(form.expenseCategoryId),
  );
  const isSalaryCategory = selectedCategory?.name === 'Зарплата';

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (row) => {
    if (!isEditableExpense(row)) return;
    setEditingId(row.id);
    setForm({
      amount: String(row.amount ?? ''),
      accountId: row.accountId ?? '',
      expenseCategoryId: row.expenseCategoryId ?? '',
      paymentMethod: row.paymentMethod ?? 'CASH',
      employeeId: '',
      comment: row.comment ?? '',
      transactionDate: row.transactionDate ?? '',
    });
    setModalOpen(true);
  };

  const submit = () => {
    const payload = {
      amount: Number(form.amount),
      accountId: form.accountId,
      expenseCategoryId: form.expenseCategoryId,
      paymentMethod: form.paymentMethod,
      comment: form.comment || undefined,
      transactionDate: form.transactionDate || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate({
      ...payload,
      sourceType: isSalaryCategory ? 'SALARY' : 'MANUAL',
      employeeId: form.employeeId || undefined,
    });
  };

  const openDelete = (row) => {
    if (!isEditableExpense(row)) return;
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
    expensesQuery,
    accountsQuery,
    categoriesQuery,
    usersQuery,
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
    openCreate,
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
    deleteMutation,
    bulkDeleteMutation,
    isSalaryCategory,
    isEditable: isEditableExpense,
    resetForm,
  };
}

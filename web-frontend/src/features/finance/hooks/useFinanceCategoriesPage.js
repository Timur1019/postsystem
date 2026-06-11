import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { financeBulkRun } from '../utils/financeBulkRun';
import { isSelectableCategory } from '../utils/financeRowRules';
import { useFinanceRowSelection } from './useFinanceRowSelection';

export function useFinanceCategoriesPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('income');
  const [name, setName] = useState('');
  const [bulkAction, setBulkAction] = useState(null);

  const incomeQuery = useQuery({
    queryKey: tenantKey('finance-income-categories'),
    queryFn: () => financeApi.categories.income().then((r) => r.data),
    enabled: tenantReady,
  });

  const expenseQuery = useQuery({
    queryKey: tenantKey('finance-expense-categories'),
    queryFn: () => financeApi.categories.expense().then((r) => r.data),
    enabled: tenantReady,
  });

  const allRows = tab === 'income' ? (incomeQuery.data ?? []) : (expenseQuery.data ?? []);
  const selection = useFinanceRowSelection(allRows, { resetKey: tab });
  const selectableRows = useMemo(() => allRows.filter(isSelectableCategory), [allRows]);
  const selectedCustom = useMemo(
    () => selection.selectedRows.filter(isSelectableCategory),
    [selection.selectedRows],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-income-categories') });
    queryClient.invalidateQueries({ queryKey: tenantKey('finance-expense-categories') });
  };

  const createIncome = useMutation({
    mutationFn: (payload) => financeApi.categories.createIncome(payload),
    onSuccess: () => {
      invalidate();
      setName('');
      toast.success(t('finance.categories.created'));
    },
  });

  const createExpense = useMutation({
    mutationFn: (payload) => financeApi.categories.createExpense(payload),
    onSuccess: () => {
      invalidate();
      setName('');
      toast.success(t('finance.categories.created'));
    },
  });

  const toggleIncome = useMutation({
    mutationFn: ({ id, active }) => financeApi.categories.toggleIncome(id, active),
    onSuccess: invalidate,
  });

  const toggleExpense = useMutation({
    mutationFn: ({ id, active }) => financeApi.categories.toggleExpense(id, active),
    onSuccess: invalidate,
  });

  const bulkToggleMutation = useMutation({
    mutationFn: ({ rows, active }) => {
      const toggle = tab === 'income'
        ? (id, value) => financeApi.categories.toggleIncome(id, value)
        : (id, value) => financeApi.categories.toggleExpense(id, value);
      return financeBulkRun(rows, (row) => toggle(row.id, active).then((r) => r));
    },
    onSuccess: ({ succeeded, failed }, { active }) => {
      invalidate();
      selection.clearSelection();
      setBulkAction(null);
      const key = active ? 'finance.bulk.enableSuccess' : 'finance.bulk.disableSuccess';
      if (failed > 0) toast.error(t('finance.bulk.partialFail', { succeeded, failed }));
      else toast.success(t(key, { count: succeeded }));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const submit = () => {
    if (!name.trim()) return;
    if (tab === 'income') createIncome.mutate({ name: name.trim() });
    else createExpense.mutate({ name: name.trim() });
  };

  const toggleRow = (row) => {
    const mutation = tab === 'income' ? toggleIncome : toggleExpense;
    mutation.mutate({ id: row.id, active: !row.active });
  };

  const toggleSelectAllCustom = () => {
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

  const confirmBulkAction = () => {
    if (!bulkAction || selectedCustom.length === 0) return;
    bulkToggleMutation.mutate({ rows: selectedCustom, active: bulkAction === 'enable' });
  };

  return {
    t,
    tab,
    setTab,
    name,
    setName,
    submit,
    incomeQuery,
    expenseQuery,
    allRows,
    selection,
    selectableRows,
    selectedCustom,
    allSelectableSelected,
    toggleSelectAllCustom,
    toggleRow,
    bulkAction,
    setBulkAction,
    confirmBulkAction,
    bulkToggleMutation,
    toggleIncome,
    toggleExpense,
  };
}

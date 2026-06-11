import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';

export function useFinanceDebtsPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('customers');
  const [payModal, setPayModal] = useState(null);
  const [form, setForm] = useState({ amount: '', accountId: '', paymentMethod: 'CASH', comment: '' });
  const [applyForm, setApplyForm] = useState({ amount: '', comment: '' });
  const [historyModal, setHistoryModal] = useState(null);

  const customerDebtsQuery = useQuery({
    queryKey: tenantKey('finance-customer-debts'),
    queryFn: () => financeApi.debts.customers.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const supplierDebtsQuery = useQuery({
    queryKey: tenantKey('finance-supplier-debts'),
    queryFn: () => financeApi.debts.suppliers.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const customerAdvancesQuery = useQuery({
    queryKey: tenantKey('finance-customer-advances'),
    queryFn: () => financeApi.debts.advances.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const accountsQuery = useQuery({
    queryKey: tenantKey('finance-accounts'),
    queryFn: () => financeApi.accounts.list().then((r) => r.data),
    enabled: tenantReady,
  });

  const payCustomerMutation = useMutation({
    mutationFn: ({ customerId, payload }) => financeApi.debts.customers.pay(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-customer-debts') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-incomes') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
      setPayModal(null);
      setForm({ amount: '', accountId: '', paymentMethod: 'CASH', comment: '' });
    },
  });

  const applyAdvanceMutation = useMutation({
    mutationFn: ({ customerId, payload }) => financeApi.debts.advances.apply(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-customer-advances') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
      setPayModal(null);
      setApplyForm({ amount: '', comment: '' });
    },
  });

  const paySupplierMutation = useMutation({
    mutationFn: ({ supplierId, payload }) => financeApi.debts.suppliers.pay(supplierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-supplier-debts') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-expenses') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-accounts') });
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-dashboard') });
      setPayModal(null);
      setForm({ amount: '', accountId: '', paymentMethod: 'CASH', comment: '' });
    },
  });

  const openHistory = (row) => {
    setHistoryModal({
      type: tab === 'customers' ? 'customer' : tab === 'advances' ? 'advance' : 'supplier',
      counterpartyId: row.counterpartyId,
      counterpartyName: row.counterpartyName,
    });
  };

  const openPay = (item) => {
    setPayModal(item);
    if (item.type === 'advance') {
      setApplyForm({
        amount: String(item.balance ?? ''),
        comment: '',
      });
      return;
    }
    setForm({
      amount: String(item.balance ?? ''),
      accountId: '',
      paymentMethod: 'CASH',
      comment: '',
    });
  };

  const submitPay = () => {
    if (!payModal) return;
    if (payModal.type === 'advance') {
      applyAdvanceMutation.mutate({
        customerId: payModal.counterpartyId,
        payload: {
          amount: Number(applyForm.amount),
          comment: applyForm.comment || undefined,
        },
      });
      return;
    }
    const payload = {
      amount: Number(form.amount),
      accountId: form.accountId,
      paymentMethod: form.paymentMethod,
      comment: form.comment || undefined,
    };
    if (payModal.type === 'customer') {
      payCustomerMutation.mutate({ customerId: payModal.counterpartyId, payload });
    } else {
      paySupplierMutation.mutate({ supplierId: payModal.counterpartyId, payload });
    }
  };

  return {
    t,
    tab,
    setTab,
    customerDebtsQuery,
    supplierDebtsQuery,
    customerAdvancesQuery,
    accountsQuery,
    payModal,
    setPayModal,
    form,
    setForm,
    applyForm,
    setApplyForm,
    openPay,
    submitPay,
    payPending: payCustomerMutation.isPending || paySupplierMutation.isPending || applyAdvanceMutation.isPending,
    historyModal,
    setHistoryModal,
    openHistory,
  };
}

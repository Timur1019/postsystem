import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { financeSyncApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useFinanceListPagination } from './useFinanceListPagination';

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useFinanceSyncPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, setPageSize } = useFinanceListPagination(20);
  const [status, setStatus] = useState('');
  const [backfillFrom, setBackfillFrom] = useState(monthStartIso());
  const [backfillTo, setBackfillTo] = useState(todayIso());
  const [backfillSales, setBackfillSales] = useState(true);
  const [backfillPurchases, setBackfillPurchases] = useState(true);

  const outboxQuery = useQuery({
    queryKey: tenantKey('finance-sync-outbox', page, pageSize, status),
    queryFn: () => financeSyncApi.outbox({
      page,
      size: pageSize,
      status: status || undefined,
    }).then((r) => r.data),
    enabled: tenantReady,
    refetchInterval: 30_000,
  });

  const backfillMutation = useMutation({
    mutationFn: () => {
      const types = [
        backfillSales ? 'sales' : null,
        backfillPurchases ? 'purchases' : null,
      ].filter(Boolean).join(',');
      return financeSyncApi.backfill({
        from: backfillFrom,
        to: backfillTo,
        types: types || 'sales',
      }).then((r) => r.data);
    },
    onSuccess: (data) => {
      toast.success(t('finance.sync.backfillSuccess', {
        sales: data.salesEnqueued,
        purchases: data.purchasesEnqueued,
        skipped: data.skipped,
      }));
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-sync-outbox') });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('finance.sync.backfillFailed')),
  });

  const retryMutation = useMutation({
    mutationFn: (id) => financeSyncApi.retryOutbox(id),
    onSuccess: () => {
      toast.success(t('finance.sync.retrySuccess'));
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-sync-outbox') });
    },
    onError: () => toast.error(t('finance.sync.retryFailed')),
  });

  const retryBatchMutation = useMutation({
    mutationFn: () => financeSyncApi.retryPending().then((r) => r.data),
    onSuccess: (data) => {
      toast.success(t('finance.sync.retryBatchSuccess', { count: data.processed ?? 0 }));
      queryClient.invalidateQueries({ queryKey: tenantKey('finance-sync-outbox') });
    },
    onError: () => toast.error(t('finance.sync.retryFailed')),
  });

  return {
    t,
    page,
    setPage,
    pageSize,
    setPageSize,
    status,
    setStatus,
    backfillFrom,
    setBackfillFrom,
    backfillTo,
    setBackfillTo,
    backfillSales,
    setBackfillSales,
    backfillPurchases,
    setBackfillPurchases,
    outboxQuery,
    backfillMutation,
    retryMutation,
    retryBatchMutation,
  };
}

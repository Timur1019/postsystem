import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useFinanceReportsPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const [tab, setTab] = useState('profitLoss');
  const [from, setFrom] = useState(monthStartIso());
  const [to, setTo] = useState(todayIso());

  const profitLossQuery = useQuery({
    queryKey: tenantKey('finance-profit-loss', from, to),
    queryFn: () => financeApi.reports.profitLoss({ from, to }).then((r) => r.data),
    enabled: tenantReady && Boolean(from && to) && tab === 'profitLoss',
  });

  const cashFlowQuery = useQuery({
    queryKey: tenantKey('finance-cash-flow', from, to),
    queryFn: () => financeApi.reports.cashFlow({ from, to }).then((r) => r.data),
    enabled: tenantReady && Boolean(from && to) && tab === 'cashFlow',
  });

  const resetFilters = () => {
    setFrom(monthStartIso());
    setTo(todayIso());
  };

  return {
    t,
    tab,
    setTab,
    from,
    setFrom,
    to,
    setTo,
    resetFilters,
    profitLossQuery,
    cashFlowQuery,
  };
}

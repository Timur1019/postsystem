import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useFinanceListPagination } from './useFinanceListPagination';

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useFinanceAuditPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const [from, setFrom] = useState(monthStartIso());
  const [to, setTo] = useState(todayIso());
  const [entityType, setEntityType] = useState('');
  const { page, setPage, pageSize, setPageSize, resetPage } = useFinanceListPagination(20);

  const query = useQuery({
    queryKey: tenantKey('finance-audit', from, to, entityType, page, pageSize),
    queryFn: () => financeApi.audit.logs({
      from,
      to,
      entityType: entityType || undefined,
      page,
      size: pageSize,
    }).then((r) => r.data),
    enabled: tenantReady && Boolean(from && to),
  });

  const setFromWithReset = (value) => {
    resetPage();
    setFrom(value);
  };

  const setToWithReset = (value) => {
    resetPage();
    setTo(value);
  };

  const setEntityTypeWithReset = (value) => {
    resetPage();
    setEntityType(value);
  };

  return {
    t,
    from,
    setFrom: setFromWithReset,
    to,
    setTo: setToWithReset,
    entityType,
    setEntityType: setEntityTypeWithReset,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    entityTypes: ['INCOME', 'EXPENSE', 'TRANSFER', 'ACCOUNT'],
  };
}

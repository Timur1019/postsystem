import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi, orderApi } from '../../../services/api';
import { ORDERS_DEFAULT_FILTERS, ORDERS_PAGE_SIZE_DEFAULT } from '../constants';

export function useOrdersListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(ORDERS_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(ORDERS_DEFAULT_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(ORDERS_PAGE_SIZE_DEFAULT);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const queryParams = useMemo(() => {
    const a = applied;
    return {
      page,
      size: pageSize,
      search: appliedSearch.trim() || undefined,
      externalNumber: a.externalNumber.trim() || undefined,
      clientName: a.clientName.trim() || undefined,
      address: a.address.trim() || undefined,
      courierId: a.courierId.trim() || undefined,
      status: a.status.trim() || undefined,
      createdFrom: a.createdFrom || undefined,
      createdTo: a.createdTo || undefined,
    };
  }, [appliedSearch, applied, page, pageSize]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['orders', queryParams],
    queryFn: () => orderApi.getAll(queryParams).then((r) => r.data),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const applySearch = useCallback(() => {
    setAppliedSearch(search.trim());
    setPage(0);
  }, [search]);

  const applyFilters = useCallback(() => {
    setApplied({ ...filters });
    setPage(0);
    setFiltersOpen(false);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(ORDERS_DEFAULT_FILTERS);
    setApplied(ORDERS_DEFAULT_FILTERS);
    setPage(0);
  }, []);

  const onExport = useCallback(() => {
    toast(t('orders.exportSoon'), { icon: 'ℹ️' });
  }, [t]);

  const onOrderCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }, [queryClient]);

  return {
    t,
    search,
    setSearch,
    applySearch,
    filtersOpen,
    setFiltersOpen,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    addOpen,
    setAddOpen,
    page,
    setPage,
    pageSize,
    setPageSize,
    stores,
    rows,
    total,
    totalPages,
    loading: isPending,
    isError,
    error,
    onExport,
    onOrderCreated,
  };
}

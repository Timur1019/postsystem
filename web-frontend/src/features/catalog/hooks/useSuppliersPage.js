import { useMemo, useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { supplierApi } from '../../../api/supplier.api';
import { useAuthStore } from '../../../store/authStore';
import { canManageCatalog, SUPPLIER_DEFAULT_FILTERS } from '../constants';

export function useSuppliersPage() {
  const { user } = useAuthStore();
  const manage = canManageCatalog(user?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState(SUPPLIER_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(SUPPLIER_DEFAULT_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      createdOn: applied.createdOn || undefined,
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['suppliers', queryParams],
    queryFn: () => supplierApi.getAll(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;
  const showEmptyHint = !loading && !isFetching && !isError && total === 0;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [totalPages, page]);

  const fmtDate = (iso) => {
    try {
      return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'dd.MM.yyyy');
    } catch {
      return '—';
    }
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(SUPPLIER_DEFAULT_FILTERS);
    setApplied(SUPPLIER_DEFAULT_FILTERS);
    setPage(0);
    setFiltersOpen(false);
  };

  const applyFilters = () => {
    setApplied(filters);
    setPage(0);
    setFiltersOpen(false);
  };

  return {
    manage,
    search,
    page,
    pageSize,
    setPage,
    setPageSize,
    filtersOpen,
    setFiltersOpen,
    addOpen,
    setAddOpen,
    filters,
    setFilters,
    rows,
    total,
    totalPages,
    loading,
    isError,
    error,
    showEmptyHint,
    fmtDate,
    handleSearchChange,
    resetFilters,
    applyFilters,
  };
}

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { cashRegisterApi, cashRegisterConfigApi, storeApi } from '../../../services/api';
import { CASH_REGISTER_CONFIG_DEFAULT_FILTERS, CASH_REGISTER_PAGE_SIZE_DEFAULT } from '../constants';

export function useCashRegisterConfigPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CASH_REGISTER_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState(CASH_REGISTER_CONFIG_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(CASH_REGISTER_CONFIG_DEFAULT_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      storeId: applied.storeId ? Number(applied.storeId) : undefined,
      equipmentSerial: applied.equipmentSerial.trim() || undefined,
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['cash-register-configs', queryParams],
    queryFn: () => cashRegisterConfigApi.getAll(queryParams).then((r) => r.data),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const { data: serials = [] } = useQuery({
    queryKey: ['cash-register-serials'],
    queryFn: () => cashRegisterApi.getEquipmentSerials().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cashRegisterConfigApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-configs'] });
      toast.success(t('cashRegisters.configDeleted'));
    },
    onError: (e) => {
      const msg = e?.response?.data?.message ?? e?.message ?? t('cashRegisters.configDeleteFailed');
      toast.error(msg);
    },
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
  }, []);

  const applyFilters = useCallback(() => {
    setApplied(filters);
    setPage(0);
    setFiltersOpen(false);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(CASH_REGISTER_CONFIG_DEFAULT_FILTERS);
    setApplied(CASH_REGISTER_CONFIG_DEFAULT_FILTERS);
    setPage(0);
  }, []);

  const handleDelete = useCallback((row) => {
    if (row.lockedDefault) return;
    if (!window.confirm(t('cashRegisters.configDeleteConfirm', { name: row.name }))) return;
    deleteMutation.mutate(row.id);
  }, [deleteMutation, t]);

  const onConfigSaved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cash-register-configs'] });
  }, [queryClient]);

  return {
    t,
    search,
    onSearchChange: handleSearchChange,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtersOpen,
    setFiltersOpen,
    addOpen,
    setAddOpen,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    stores,
    serials,
    rows,
    total,
    totalPages,
    loading: isPending,
    isError,
    error,
    handleDelete,
    onConfigSaved,
  };
}

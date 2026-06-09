import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { cashRegisterApi } from '../../../services/api';
import {
  CASH_REGISTER_PAGE_SIZE_DEFAULT,
  CASH_REGISTER_PAGE_SIZE_OPTIONS,
  CASH_REGISTERS_DEFAULT_FILTERS,
} from '../constants';
import { buildPageWindow } from '../utils/cashRegisterDisplayUtils';

export function useCashRegistersListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CASH_REGISTER_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(CASH_REGISTERS_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(CASH_REGISTERS_DEFAULT_FILTERS);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      equipmentModel: applied.equipmentModel.trim() || undefined,
      equipmentSerial: applied.equipmentSerial.trim() || undefined,
      fiscalCardId: applied.fiscalCardId.trim() || undefined,
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['cash-registers', queryParams],
    queryFn: () => cashRegisterApi.getAll(queryParams).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => cashRegisterApi.toggleStatus(id).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-config-form-options'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers-pick'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-detail', updated.id] });
      toast.success(
        updated.status === 'ACTIVE' ? t('cashRegisters.statusToggledOn') : t('cashRegisters.statusToggledOff')
      );
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? t('cashRegisters.statusToggleFailed')),
    onSettled: () => setTogglingId(null),
  });

  const handleToggleStatus = useCallback((e, row) => {
    e.stopPropagation();
    setTogglingId(row.id);
    toggleMutation.mutate(row.id);
  }, [toggleMutation]);

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const fromN = total === 0 ? 0 : page * pageSize + 1;
  const toN = Math.min((page + 1) * pageSize, total);
  const pageButtons = useMemo(() => buildPageWindow(page, totalPages), [page, totalPages]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(0);
  }, []);

  const applyFilters = useCallback(() => {
    setApplied({ ...filters });
    setPage(0);
    setFiltersOpen(false);
  }, [filters]);

  const resetFilters = useCallback(() => {
    const next = { ...CASH_REGISTERS_DEFAULT_FILTERS };
    setFilters(next);
    setApplied(next);
    setPage(0);
  }, []);

  return {
    t,
    search,
    onSearchChange: handleSearchChange,
    togglingId,
    detailId,
    setDetailId,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageSizeOptions: CASH_REGISTER_PAGE_SIZE_OPTIONS,
    filtersOpen,
    setFiltersOpen,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    rows,
    total,
    totalPages,
    fromN,
    toN,
    pageButtons,
    loading: isPending,
    isError,
    error,
    handleToggleStatus,
  };
}

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { cashRegisterApi } from '../../../services/api';
import { CASH_REGISTER_PAGE_SIZE_DEFAULT, CASH_REGISTER_TRANSFER_DEFAULT_FILTERS } from '../constants';
import { downloadExcelBlob } from '../utils/cashRegisterDisplayUtils';

export function useCashRegisterTransferPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CASH_REGISTER_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(CASH_REGISTER_TRANSFER_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(CASH_REGISTER_TRANSFER_DEFAULT_FILTERS);
  const [exporting, setExporting] = useState(false);

  const queryParams = useMemo(() => {
    const reg = applied.registerNumber.trim();
    return {
      page,
      size: pageSize,
      search: search.trim() || undefined,
      registerNumber: reg ? Number(reg) : undefined,
      closedFrom: applied.closedFrom || undefined,
      closedTo: applied.closedTo || undefined,
    };
  }, [search, page, pageSize, applied]);

  const exportParams = useMemo(() => {
    const reg = applied.registerNumber.trim();
    return {
      search: search.trim() || undefined,
      registerNumber: reg ? Number(reg) : undefined,
      closedFrom: applied.closedFrom || undefined,
      closedTo: applied.closedTo || undefined,
    };
  }, [search, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['cash-registers-transfers', queryParams],
    queryFn: () => cashRegisterApi.getTransfers(queryParams).then((r) => r.data),
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
    setFilters(CASH_REGISTER_TRANSFER_DEFAULT_FILTERS);
    setApplied(CASH_REGISTER_TRANSFER_DEFAULT_FILTERS);
    setPage(0);
  }, []);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const res = await cashRegisterApi.exportTransfers(exportParams);
      const suffix =
        applied.closedFrom && applied.closedTo
          ? `${applied.closedFrom}_${applied.closedTo}`
          : new Date().toISOString().slice(0, 10);
      downloadExcelBlob(res.data, `cash_transfer_${suffix}.xlsx`);
      toast.success(t('cashRegisters.transferExportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('cashRegisters.transferExportFailed'));
    } finally {
      setExporting(false);
    }
  }, [applied.closedFrom, applied.closedTo, exportParams, t]);

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
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    exporting,
    rows,
    total,
    totalPages,
    loading: isPending,
    isError,
    error,
    handleExportExcel,
  };
}

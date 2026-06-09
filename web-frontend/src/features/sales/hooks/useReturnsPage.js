import { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { returnApi, storeApi } from '../../../api';
import { RETURNS_DEFAULT_FILTERS, SALES_PAGE_SIZE_DEFAULT } from '../constants';

export function useReturnsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(SALES_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(RETURNS_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(RETURNS_DEFAULT_FILTERS);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailReason, setDetailReason] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [createReturnOpen, setCreateReturnOpen] = useState(false);
  const [continueReturnSaleId, setContinueReturnSaleId] = useState(null);
  const qc = useQueryClient();

  const invalidateReturnQueries = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['returns'] });
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['my-sales'] });
  }, [qc]);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      fiscalSearch: search.trim() || undefined,
      from: applied.dateFrom || undefined,
      to: applied.dateTo || undefined,
      cashierName: applied.cashierName.trim() || undefined,
      storeId: applied.storeId === '' ? undefined : Number(applied.storeId),
    }),
    [search, page, pageSize, applied]
  );

  const exportParams = useMemo(
    () => ({
      fiscalSearch: search.trim() || undefined,
      from: applied.dateFrom || undefined,
      to: applied.dateTo || undefined,
      cashierName: applied.cashierName.trim() || undefined,
      storeId: applied.storeId === '' ? undefined : Number(applied.storeId),
    }),
    [search, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['returns', queryParams],
    queryFn: () => returnApi.getAll(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const updateReasonMutation = useMutation({
    mutationFn: ({ id, reason }) => returnApi.updateReason(id, { reason }),
    onSuccess: () => {
      toast.success(t('returnsModule.updateReasonSuccess'));
      qc.invalidateQueries({ queryKey: ['returns'] });
      setEditRow(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('returnsModule.updateReasonFailed')),
  });

  const cancelReturnMutation = useMutation({
    mutationFn: (id) => returnApi.delete(id),
    onSuccess: () => {
      toast.success(t('returnsModule.cancelReturnSuccess'));
      qc.invalidateQueries({ queryKey: ['returns'] });
      setMenuOpenId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('returnsModule.cancelReturnFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;
  const showEmptyHint = !loading && !isError && rows.length === 0;

  const fmtAt = useCallback((iso) => {
    try {
      return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'dd.MM.yyyy HH:mm');
    } catch {
      return '—';
    }
  }, []);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const res = await returnApi.exportExcel(exportParams);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix =
        applied.dateFrom && applied.dateTo
          ? `${applied.dateFrom}_${applied.dateTo}`
          : new Date().toISOString().slice(0, 10);
      a.download = `returns_report_${suffix}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('returnsModule.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('returnsModule.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [exportParams, applied.dateFrom, applied.dateTo, t]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const resetFilters = () => {
    const f = { ...RETURNS_DEFAULT_FILTERS };
    setFilters(f);
    setApplied(f);
    setPage(0);
  };

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(0);
    setFiltersOpen(false);
  };

  const errorMessage =
    error?.response?.status === 403
      ? t('returnsModule.forbidden')
      : error?.response?.data?.message ?? error?.message ?? t('returnsModule.loadError');

  const openDetail = (row) => {
    setDetailId(row.id);
    setDetailReason(row.reason ?? '');
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetailReason('');
  };

  const saveReason = (reason) => {
    updateReasonMutation.mutate({ id: editRow.id, reason });
  };

  const tryCancelReturn = (row) => {
    if (!window.confirm(t('returnsModule.deleteConfirm'))) return;
    cancelReturnMutation.mutate(row.id);
  };

  const startContinueReturn = (row) => {
    setContinueReturnSaleId(row.id);
    setMenuOpenId(null);
  };

  return {
    t,
    search,
    page,
    pageSize,
    setPage,
    setPageSize,
    filtersOpen,
    setFiltersOpen,
    filters,
    setFilters,
    stores,
    menuOpenId,
    setMenuOpenId,
    detailId,
    detailReason,
    editRow,
    setEditRow,
    exporting,
    createReturnOpen,
    setCreateReturnOpen,
    continueReturnSaleId,
    setContinueReturnSaleId,
    rows,
    total,
    totalPages,
    loading,
    isError,
    errorMessage,
    showEmptyHint,
    fmtAt,
    handleSearchChange,
    handleExportExcel,
    resetFilters,
    applyFilters,
    invalidateReturnQueries,
    openDetail,
    closeDetail,
    saveReason,
    tryCancelReturn,
    startContinueReturn,
    updateReasonSaving: updateReasonMutation.isPending,
  };
}

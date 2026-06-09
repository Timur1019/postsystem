import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { zReportApi, storeApi } from '../../../services/api';
import { CASH_REGISTER_PAGE_SIZE_DEFAULT, Z_REPORTS_DEFAULT_FILTERS } from '../constants';
import { downloadExcelBlob } from '../utils/cashRegisterDisplayUtils';

export function useZReportsPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CASH_REGISTER_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(Z_REPORTS_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(Z_REPORTS_DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [rowMenu, setRowMenu] = useState(null);
  const [printZId, setPrintZId] = useState(null);
  const selectAllRef = useRef(null);

  const closeZPrint = useCallback(() => setPrintZId(null), []);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const queryParams = useMemo(() => {
    const a = applied;
    return {
      page,
      size: pageSize,
      search: search.trim() || undefined,
      storeId: a.storeId ? Number(a.storeId) : undefined,
      closedFrom: a.closedFrom || undefined,
      closedTo: a.closedTo || undefined,
      fiscalCardId: a.fiscalCardId.trim() || undefined,
      terminalSerial: a.terminalSerial.trim() || undefined,
    };
  }, [search, page, pageSize, applied]);

  const exportParams = useMemo(() => {
    const a = applied;
    return {
      search: search.trim() || undefined,
      storeId: a.storeId ? Number(a.storeId) : undefined,
      closedFrom: a.closedFrom || undefined,
      closedTo: a.closedTo || undefined,
      fiscalCardId: a.fiscalCardId.trim() || undefined,
      terminalSerial: a.terminalSerial.trim() || undefined,
    };
  }, [search, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['z-reports', queryParams],
    queryFn: () => zReportApi.getAll(queryParams).then((r) => r.data),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllPage = useCallback(() => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [allPageSelected, pageIds]);

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
    const next = { ...Z_REPORTS_DEFAULT_FILTERS };
    setFilters(next);
    setApplied(next);
    setPage(0);
  }, []);

  const handleExportAll = useCallback(async () => {
    try {
      const res = await zReportApi.exportAll(exportParams);
      downloadExcelBlob(res.data, `z_reports_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(t('zReports.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('zReports.exportFailed'));
    }
  }, [exportParams, t]);

  const handleExportRowSales = useCallback(async (id) => {
    try {
      const res = await zReportApi.exportSales(id);
      downloadExcelBlob(res.data, `z_report_${id}_sales.xlsx`);
      toast.success(t('zReports.exportSalesDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('zReports.exportFailed'));
    }
  }, [t]);

  const openRowMenu = useCallback((e, row) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu((cur) => (cur?.row?.id === row.id ? null : { row, rect }));
  }, []);

  const closeRowMenu = useCallback(() => setRowMenu(null), []);

  const startPrint = useCallback((id) => {
    setPrintZId(id);
    setRowMenu(null);
  }, []);

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
    stores,
    rows,
    total,
    totalPages,
    loading: isPending,
    isError,
    error,
    selectedIds,
    selectAllRef,
    allPageSelected,
    toggleSelect,
    toggleSelectAllPage,
    rowMenu,
    openRowMenu,
    closeRowMenu,
    handleExportAll,
    handleExportRowSales,
    printZId,
    closeZPrint,
    startPrint,
  };
}

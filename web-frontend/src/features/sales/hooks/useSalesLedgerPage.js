import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { saleApi, storeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { salePaymentLabel } from '../../../utils/salePaymentLabel';
import { SALES_LEDGER_DEFAULT_FILTERS, SALES_PAGE_SIZE_DEFAULT } from '../constants';

export function useSalesLedgerPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { tenantKey, tenantReady } = useTenantScope();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(SALES_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(SALES_LEDGER_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(SALES_LEDGER_DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [rowMenu, setRowMenu] = useState(null);
  const [printSaleId, setPrintSaleId] = useState(null);
  const [returnSaleId, setReturnSaleId] = useState(null);
  const [createReturnOpen, setCreateReturnOpen] = useState(false);
  const selectAllRef = useRef(null);

  const { data: stores = [] } = useQuery({
    queryKey: tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const queryParams = useMemo(() => {
    const a = applied;
    return {
      page,
      size: pageSize,
      search: search.trim() || undefined,
      from: a.dateFrom || undefined,
      to: a.dateTo || undefined,
      receiptNumber: a.receiptNumber.trim() || undefined,
      saleId: a.saleId.trim() || undefined,
      cashierName: a.cashierName.trim() || undefined,
      paymentMethod: a.paymentMethod || undefined,
      paymentSettlement: a.paymentSettlement === 'ALL' ? undefined : a.paymentSettlement,
      storeId: a.storeId === '' ? undefined : Number(a.storeId),
    };
  }, [search, page, pageSize, applied]);

  const exportParams = useMemo(() => {
    const a = applied;
    return {
      search: search.trim() || undefined,
      from: a.dateFrom || undefined,
      to: a.dateTo || undefined,
      receiptNumber: a.receiptNumber.trim() || undefined,
      saleId: a.saleId.trim() || undefined,
      cashierName: a.cashierName.trim() || undefined,
      paymentMethod: a.paymentMethod || undefined,
      paymentSettlement: a.paymentSettlement === 'ALL' ? undefined : a.paymentSettlement,
      storeId: a.storeId === '' ? undefined : Number(a.storeId),
    };
  }, [search, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: tenantKey('sales-ledger', queryParams),
    queryFn: () => saleApi.getAll(queryParams).then((r) => r.data),
    enabled: tenantReady,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
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
  };

  const paymentLabel = useCallback((row) => salePaymentLabel(row, t), [t]);

  const paymentIconMethod = useCallback(
    (row) =>
      row.receiptType === 'CREDIT' || row.receiptType === 'ADVANCE' ? row.receiptType : row.paymentMethod,
    []
  );

  const fmtAt = useCallback((iso) => {
    try {
      return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'yyyy-MM-dd, HH:mm:ss');
    } catch {
      return '—';
    }
  }, []);

  const handleExportSalesExcel = useCallback(async () => {
    try {
      const res = await saleApi.exportLines(exportParams);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_ledger_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('salesLedger.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('salesLedger.exportFailed'));
    }
  }, [exportParams, t]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const resetFilters = () => {
    const f = { ...SALES_LEDGER_DEFAULT_FILTERS };
    setFilters(f);
    setApplied(f);
    setPage(0);
  };

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(0);
    setFiltersOpen(false);
  };

  const openRowMenu = (row, rect) => {
    setRowMenu((cur) => (cur?.row?.id === row.id ? null : { row, rect }));
  };

  const closeRowMenu = () => setRowMenu(null);

  const invalidateSalesQueries = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['returns'] });
  }, [qc]);

  const errorMessage =
    error?.response?.data?.message ?? error?.message ?? t('salesLedger.loadError');

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
    selectedIds,
    rowMenu,
    printSaleId,
    setPrintSaleId,
    returnSaleId,
    setReturnSaleId,
    createReturnOpen,
    setCreateReturnOpen,
    selectAllRef,
    rows,
    total,
    totalPages,
    loading,
    isError,
    errorMessage,
    allPageSelected,
    toggleSelect,
    toggleSelectAllPage,
    paymentLabel,
    paymentIconMethod,
    fmtAt,
    handleSearchChange,
    handleExportSalesExcel,
    resetFilters,
    applyFilters,
    openRowMenu,
    closeRowMenu,
    invalidateSalesQueries,
  };
}

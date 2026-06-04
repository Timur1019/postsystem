import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { saleApi } from '../services/api';
import {
  CASHIER_SALES_EMPTY_FILTERS,
  CASHIER_SALES_RECEIPT_DEBOUNCE_MS,
  CASHIER_SALES_VIEW_STORAGE_KEY,
  readCashierSalesViewMode,
} from '../components/cashier/my-sales/cashierSalesConstants';
import {
  buildCashierSalesQueryParams,
  normalizeCashierSalesFilters,
} from '../components/cashier/my-sales/cashierSalesFilterUtils';
import { useCashierShift } from './useCashierShift';
import { useCashierStore } from './useCashierStore';
import { useDebouncedValue } from './useDebouncedValue';

export function useCashierMySalesPage() {
  const qc = useQueryClient();
  const { storeId } = useCashierStore();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(CASHIER_SALES_EMPTY_FILTERS);
  const [returnSaleId, setReturnSaleId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState(readCashierSalesViewMode);

  const debouncedReceipt = useDebouncedValue(filters.receiptNumber, CASHIER_SALES_RECEIPT_DEBOUNCE_MS);
  const appliedFilters = useMemo(
    () => normalizeCashierSalesFilters({ ...filters, receiptNumber: debouncedReceipt }),
    [filters.paymentMethod, filters.status, filters.from, filters.to, debouncedReceipt]
  );
  const filtering = filters.receiptNumber !== debouncedReceipt;
  const { data: shift, isPending: shiftLoading } = useCashierShift(storeId);
  const shiftId = shift?.id;

  useEffect(() => {
    if (storeId) {
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
    }
  }, [storeId, qc]);

  useEffect(() => {
    setPage(0);
  }, [appliedFilters]);

  const salesQueryParams = useMemo(
    () => ({ ...buildCashierSalesQueryParams(appliedFilters, page), shiftId }),
    [appliedFilters, page, shiftId]
  );

  const {
    data: sales,
    isPending: salesLoading,
    isError: salesError,
  } = useQuery({
    queryKey: ['my-sales', salesQueryParams],
    queryFn: () => saleApi.mySales(salesQueryParams).then((r) => r.data),
    enabled: !!shiftId,
  });

  const rows = useMemo(() => sales?.content ?? [], [sales?.content]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  useEffect(() => {
    if (selectedId && !rows.some((r) => r.id === selectedId)) {
      setSelectedId(null);
    }
  }, [rows, selectedId]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const handleRowClick = (row) => {
    setSelectedId((prev) => (prev === row.id ? null : row.id));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(CASHIER_SALES_VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const patchFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setFilters(CASHIER_SALES_EMPTY_FILTERS);
    setPage(0);
  };

  const handleReturnSuccess = () => {
    qc.invalidateQueries({ queryKey: ['my-sales'] });
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
    qc.invalidateQueries({ queryKey: ['returns'] });
    if (selectedRow?.receiptNumber) {
      qc.invalidateQueries({ queryKey: ['receipt', selectedRow.receiptNumber] });
    }
  };

  return {
    storeId,
    page,
    setPage,
    filters,
    patchFilters,
    resetFilters,
    filtering,
    returnSaleId,
    setReturnSaleId,
    selectedId,
    setSelectedId,
    viewMode,
    handleViewModeChange,
    shift,
    shiftId,
    shiftLoading,
    sales,
    salesLoading,
    salesError,
    rows,
    selectedRow,
    handleRowClick,
    handleReturnSuccess,
  };
}

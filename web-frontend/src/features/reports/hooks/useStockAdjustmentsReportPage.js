import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { REPORT_PAGE_SIZE_WIDE } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useStockAdjustmentsReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange();
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_WIDE);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, search, storeId]
  );

  const exportParams = useMemo(
    () => ({
      from,
      to,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, search, storeId]
  );

  const query = useQuery({
    queryKey: ['stock-adjustments', params],
    queryFn: () => stockReportApi.adjustments(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const handleSearchChange = (value) => {
    setSearch(value);
    resetPage();
  };

  const handleStoreChange = (value) => {
    setStoreId(value);
    resetPage();
  };

  return {
    from,
    to,
    setFrom,
    setTo,
    search,
    storeId,
    stores,
    exportParams,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    handleSearchChange,
    handleStoreChange,
  };
}

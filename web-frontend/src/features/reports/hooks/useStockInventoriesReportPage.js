import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useStockInventoriesReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [storeId, setStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({ from, to, page, size: pageSize, storeId: storeId === '' ? undefined : Number(storeId) }),
    [from, to, page, pageSize, storeId]
  );

  const exportParams = useMemo(
    () => ({ from, to, storeId: storeId === '' ? undefined : Number(storeId) }),
    [from, to, storeId]
  );

  const query = useQuery({
    queryKey: ['stock-inventories-report', params],
    queryFn: () => stockReportApi.inventories(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const handleStoreChange = (value) => {
    setStoreId(value);
    resetPage();
  };

  return {
    from,
    to,
    setFrom,
    setTo,
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
    handleStoreChange,
  };
}

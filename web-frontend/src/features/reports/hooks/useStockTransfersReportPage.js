import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useStockTransfersReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      fromStoreId: fromStoreId === '' ? undefined : Number(fromStoreId),
      toStoreId: toStoreId === '' ? undefined : Number(toStoreId),
    }),
    [from, to, page, pageSize, fromStoreId, toStoreId]
  );

  const exportParams = useMemo(
    () => ({
      from,
      to,
      fromStoreId: fromStoreId === '' ? undefined : Number(fromStoreId),
      toStoreId: toStoreId === '' ? undefined : Number(toStoreId),
    }),
    [from, to, fromStoreId, toStoreId]
  );

  const query = useQuery({
    queryKey: ['stock-transfers-report', params],
    queryFn: () => stockReportApi.transfers(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const handleFromStoreChange = (value) => {
    setFromStoreId(value);
    resetPage();
  };

  const handleToStoreChange = (value) => {
    setToStoreId(value);
    resetPage();
  };

  return {
    from,
    to,
    setFrom,
    setTo,
    fromStoreId,
    toStoreId,
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
    handleFromStoreChange,
    handleToStoreChange,
  };
}

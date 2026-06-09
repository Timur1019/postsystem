import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';

export function useStoreSalesReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange();
  const { page, setPage, pageSize, setPageSize } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);

  const params = useMemo(() => ({ from, to, page, size: pageSize }), [from, to, page, pageSize]);
  const exportParams = useMemo(() => ({ from, to }), [from, to]);

  const query = useQuery({
    queryKey: ['reports-sales-by-stores', params],
    queryFn: () => reportApi.salesByStores(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  return {
    from,
    to,
    setFrom,
    setTo,
    rangeEnabled,
    exportParams,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
  };
}

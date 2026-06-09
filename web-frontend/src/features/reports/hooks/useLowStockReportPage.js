import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportPagination } from './useReportPagination';

export function useLowStockReportPage() {
  const { tenantKey, tenantReady } = useTenantScope();
  const { page, setPage, pageSize, setPageSize } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);

  const query = useQuery({
    queryKey: tenantKey('reports-low-stock', page, pageSize),
    queryFn: () => stockReportApi.lowStock({ page, size: pageSize }).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: tenantReady,
  });

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
}

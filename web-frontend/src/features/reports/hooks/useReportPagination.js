import { useCallback, useState } from 'react';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';

export function useReportPagination(initialPageSize = REPORT_PAGE_SIZE_DEFAULT) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const resetPage = useCallback(() => setPage(0), []);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    resetPage,
  };
}

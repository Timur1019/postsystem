import { useState } from 'react';

export function useFinanceListPagination(initialPageSize = 20) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    resetPage: () => setPage(0),
  };
}

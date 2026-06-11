import { useEffect, useMemo, useState } from 'react';

export function useClientTablePagination(items, { initialPageSize = 14, resetKey } = {}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  const total = items?.length ?? 0;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return (items ?? []).slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return {
    rows,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
  };
}

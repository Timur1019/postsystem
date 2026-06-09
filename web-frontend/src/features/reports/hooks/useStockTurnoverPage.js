import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportCategories } from './useReportCategories';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';

export function useStockTurnoverPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { data: categories = [] } = useReportCategories();

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      search: search.trim() || undefined,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
    }),
    [from, to, page, pageSize, search, categoryId]
  );

  const query = useQuery({
    queryKey: ['stock-turnover', params],
    queryFn: () => stockReportApi.turnover(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const handleSearchChange = (value) => {
    setSearch(value);
    resetPage();
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    resetPage();
  };

  return {
    from,
    to,
    setFrom,
    setTo,
    search,
    categoryId,
    categories,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    handleSearchChange,
    handleCategoryChange,
  };
}

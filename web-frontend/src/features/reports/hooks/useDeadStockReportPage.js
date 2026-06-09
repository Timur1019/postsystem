import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { stockReportApi } from '../../../api';
import { DEAD_STOCK_DAYS_DEFAULT, REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportCategories } from './useReportCategories';
import { useReportPagination } from './useReportPagination';

export function useDeadStockReportPage() {
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [daysNoSale, setDaysNoSale] = useState(DEAD_STOCK_DAYS_DEFAULT);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const { data: categories = [] } = useReportCategories();

  const asOfDate = format(new Date(), 'yyyy-MM-dd');

  const params = useMemo(
    () => ({
      asOfDate,
      daysNoSale,
      page,
      size: pageSize,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [asOfDate, daysNoSale, categoryId, search, page, pageSize]
  );

  const exportParams = useMemo(
    () => ({
      asOfDate,
      daysNoSale,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [asOfDate, daysNoSale, categoryId, search]
  );

  const query = useQuery({
    queryKey: ['dead-stock', params],
    queryFn: () => stockReportApi.deadStock(params).then((r) => r.data),
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

  const handleDaysChange = (value) => {
    setDaysNoSale(Number(value) || DEAD_STOCK_DAYS_DEFAULT);
    resetPage();
  };

  return {
    daysNoSale,
    categoryId,
    search,
    categories,
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
    handleCategoryChange,
    handleDaysChange,
  };
}

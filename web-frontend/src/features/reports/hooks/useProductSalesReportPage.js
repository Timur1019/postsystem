import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportApi } from '../../../api/report.api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';
import { useReportCategories } from './useReportCategories';

export function useProductSalesReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange();
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: stores = [] } = useReportStores();
  const { data: categories = [] } = useReportCategories();

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
      categoryId: categoryId === '' ? undefined : Number(categoryId),
    }),
    [from, to, page, pageSize, search, storeId, categoryId]
  );

  const exportParams = useMemo(
    () => ({
      from,
      to,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
      categoryId: categoryId === '' ? undefined : Number(categoryId),
    }),
    [from, to, search, storeId, categoryId]
  );

  const query = useQuery({
    queryKey: ['reports-sales-by-products', params],
    queryFn: () => reportApi.salesByProducts(params).then((r) => r.data),
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

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    resetPage();
  };

  return {
    from,
    to,
    setFrom,
    setTo,
    rangeEnabled,
    search,
    storeId,
    categoryId,
    page,
    pageSize,
    setPage,
    setPageSize,
    stores,
    categories,
    exportParams,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    handleSearchChange,
    handleStoreChange,
    handleCategoryChange,
  };
}

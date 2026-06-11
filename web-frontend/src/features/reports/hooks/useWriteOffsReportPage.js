import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useWriteOffsReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [storeId, setStoreId] = useState('');
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [pickProduct, setPickProduct] = useState(null);
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, storeId]
  );

  const query = useQuery({
    queryKey: ['write-offs', params],
    queryFn: () => stockReportApi.writeOffs(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const handleStoreChange = (value) => {
    setStoreId(value);
    resetPage();
  };

  const openWriteOff = () => {
    setWriteOffOpen(true);
    setPickProduct(null);
  };

  const closeWriteOff = () => {
    setPickProduct(null);
    setWriteOffOpen(false);
  };

  const selectProduct = (product) => {
    setPickProduct(product);
  };

  const numericStoreId = storeId === '' ? null : Number(storeId);

  return {
    from,
    to,
    setFrom,
    setTo,
    storeId,
    stores,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    handleStoreChange,
    writeOffOpen,
    pickProduct,
    openWriteOff,
    closeWriteOff,
    selectProduct,
    numericStoreId,
    refetch: query.refetch,
  };
}

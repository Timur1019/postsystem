import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { productApi, storeApi } from '../../../api';

export function useProductLifecycleSection(productId, showStoreFilter = false) {
  const [from, setFrom] = useState(format(subDays(new Date(), 89), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [movementType, setMovementType] = useState('ALL');
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: showStoreFilter,
  });

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      movementType: movementType === 'ALL' ? undefined : movementType,
      storeId: showStoreFilter && storeId !== '' ? Number(storeId) : undefined,
    }),
    [from, to, page, pageSize, movementType, storeId, showStoreFilter]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['product-lifecycle', productId, params],
    queryFn: () => productApi.lifecycle(productId, params).then((r) => r.data),
    enabled: !!productId,
    placeholderData: keepPreviousData,
  });

  const summary = data?.summary;
  const events = data?.events;
  const rows = events?.content ?? [];
  const total = events?.totalElements ?? 0;
  const totalPages = events?.totalPages ?? 0;

  const handleFromChange = (value) => {
    setFrom(value);
    setPage(0);
  };

  const handleToChange = (value) => {
    setTo(value);
    setPage(0);
  };

  const handleMovementTypeChange = (value) => {
    setMovementType(value);
    setPage(0);
  };

  const handleStoreChange = (value) => {
    setStoreId(value);
    setPage(0);
  };

  return {
    from,
    to,
    movementType,
    storeId,
    page,
    pageSize,
    stores,
    summary,
    rows,
    total,
    totalPages,
    isPending,
    isError,
    error,
    setPage,
    setPageSize,
    handleFromChange,
    handleToChange,
    handleMovementTypeChange,
    handleStoreChange,
  };
}

import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productApi, categoryApi, storeApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';
import { PRODUCT_DEFAULT_FILTERS } from '../../constants';

export function useProductsPageData() {
  const { tenantKey, tenantReady } = useTenantScope();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [appliedFilters, setAppliedFilters] = useState(PRODUCT_DEFAULT_FILTERS);

  const queryParams = useMemo(() => {
    const af = appliedFilters;
    return {
      search: search.trim() || undefined,
      page,
      size: pageSize,
      activeOnly: af.deletedScope === 'ACTIVE',
      deletedScope: af.deletedScope === 'ACTIVE' ? undefined : af.deletedScope,
      categoryId: af.categoryId === '' ? undefined : Number(af.categoryId),
      storeId: af.storeId === '' ? undefined : Number(af.storeId),
      ikpuStatus: af.ikpuStatus === 'ALL' ? undefined : af.ikpuStatus,
      markedProduct:
        af.markedProduct === '' ? undefined : af.markedProduct === 'true',
      soldIndividually:
        af.soldIndividually === '' ? undefined : af.soldIndividually === 'true',
      barcode: af.barcode.trim() || undefined,
    };
  }, [search, page, pageSize, appliedFilters]);

  const { data, isLoading } = useQuery({
    queryKey: tenantKey('products', queryParams),
    queryFn: () => productApi.getAll(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: tenantReady,
  });

  const { data: categories = [] } = useQuery({
    queryKey: tenantKey('categories'),
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const { data: stores = [] } = useQuery({
    queryKey: tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const activeStores = useMemo(
    () => (stores ?? []).filter((s) => s.active !== false),
    [stores]
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  return {
    search,
    page,
    pageSize,
    setPage,
    setPageSize,
    appliedFilters,
    setAppliedFilters,
    queryParams,
    data,
    isLoading,
    categories,
    stores,
    activeStores,
    handleSearchChange,
    total: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    pageContent: data?.content ?? [],
  };
}

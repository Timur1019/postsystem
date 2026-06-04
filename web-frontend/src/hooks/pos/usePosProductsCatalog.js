import { useCallback, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { categoryApi, productApi } from '../../services/api';
import { ALL_CATEGORY_ID } from '../../components/cashier/PosCatalogPanel';
import { POS_PRODUCT_PAGE_SIZE } from '../../components/cashier/pos/posCatalogConstants';

export function usePosProductsCatalog({ storeId, posPane }) {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [catalogBrowse, setCatalogBrowse] = useState('categories');

  const searchActive = search.trim().length > 0;
  const categoryFilterId =
    searchActive || selectedCategoryId === ALL_CATEGORY_ID
      ? undefined
      : selectedCategoryId;

  const productsEnabled =
    !!storeId && posPane === 'catalog' && (searchActive || catalogBrowse === 'products');

  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: !!storeId,
  });

  const {
    data: productsPages,
    isPending: productsLoading,
    isFetchingNextPage: productsLoadingMore,
    hasNextPage: productsHasMore,
    fetchNextPage: fetchMoreProducts,
  } = useInfiniteQuery({
    queryKey: ['pos-products', storeId, categoryFilterId, search.trim()],
    queryFn: ({ pageParam }) =>
      productApi
        .getAll({
          storeId,
          categoryId: categoryFilterId,
          search: search.trim() || undefined,
          page: pageParam,
          size: POS_PRODUCT_PAGE_SIZE,
          activeOnly: true,
        })
        .then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.number ?? 0) + 1;
      const total = lastPage?.totalPages ?? 0;
      return next < total ? next : undefined;
    },
    enabled: productsEnabled,
  });

  const products = productsPages?.pages.flatMap((page) => page?.content ?? []) ?? [];

  const handleSelectCategory = useCallback((id) => {
    setSelectedCategoryId(id);
    setSearch('');
    setCatalogBrowse('products');
  }, []);

  return {
    search,
    setSearch,
    selectedCategoryId,
    catalogBrowse,
    setCatalogBrowse,
    searchActive,
    categories,
    categoriesLoading,
    products,
    productsLoading,
    productsLoadingMore,
    productsHasMore,
    fetchMoreProducts,
    handleSelectCategory,
  };
}

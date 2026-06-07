import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { categoryApi, productApi } from '../../services/api';
import { ALL_CATEGORY_ID } from '../../components/cashier/PosCatalogPanel';
import { POS_PRODUCT_PAGE_SIZE } from '../../components/cashier/pos/posCatalogConstants';
import { useConnectivityStore } from '../../store/connectivityStore';
import {
  isDesktopOfflineBridge,
  offlineListCategories,
  offlineSearchProducts,
} from '../../services/offline/desktopOfflineBridge';

export function usePosProductsCatalog({ storeId, posPane }) {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [catalogBrowse, setCatalogBrowse] = useState('categories');
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const useLocalCatalog = isDesktopOfflineBridge() && offlineMode;

  const searchActive = search.trim().length > 0;
  const categoryFilterId =
    searchActive || selectedCategoryId === ALL_CATEGORY_ID
      ? undefined
      : selectedCategoryId;

  const productsEnabled =
    !!storeId && posPane === 'catalog' && (searchActive || catalogBrowse === 'products');

  const {
    data: categories = [],
    isPending: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ['pos-categories', useLocalCatalog ? 'offline' : 'online'],
    queryFn: () =>
      useLocalCatalog
        ? offlineListCategories()
        : categoryApi.getAll().then((r) => r.data),
    enabled: !!storeId,
    retry: useLocalCatalog ? false : 2,
    staleTime: useLocalCatalog ? Infinity : 0,
  });

  const {
    data: productsPages,
    isPending: productsLoading,
    isError: productsError,
    isFetchingNextPage: productsLoadingMore,
    hasNextPage: productsHasMore,
    fetchNextPage: fetchMoreProducts,
  } = useInfiniteQuery({
    queryKey: ['pos-products', storeId, categoryFilterId, search.trim(), useLocalCatalog ? 'offline' : 'online'],
    queryFn: async ({ pageParam }) => {
      if (useLocalCatalog) {
        const content = await offlineSearchProducts({
          search: search.trim(),
          categoryId: categoryFilterId,
          limit: POS_PRODUCT_PAGE_SIZE,
          offset: pageParam,
        });
        const total = content.length < POS_PRODUCT_PAGE_SIZE ? pageParam + content.length : pageParam + content.length + 1;
        return {
          content,
          number: pageParam / POS_PRODUCT_PAGE_SIZE,
          totalPages: content.length < POS_PRODUCT_PAGE_SIZE ? pageParam / POS_PRODUCT_PAGE_SIZE + 1 : pageParam / POS_PRODUCT_PAGE_SIZE + 2,
          totalElements: total,
        };
      }
      return productApi
        .getAll({
          storeId,
          categoryId: categoryFilterId,
          search: search.trim() || undefined,
          page: pageParam,
          size: POS_PRODUCT_PAGE_SIZE,
          activeOnly: true,
        })
        .then((r) => r.data);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const next = (lastPage?.number ?? 0) + 1;
      const total = lastPage?.totalPages ?? 0;
      return next < total ? (useLocalCatalog ? lastPageParam + POS_PRODUCT_PAGE_SIZE : next) : undefined;
    },
    enabled: productsEnabled,
    retry: useLocalCatalog ? false : 2,
    staleTime: useLocalCatalog ? Infinity : 0,
  });

  const products = productsPages?.pages.flatMap((page) => page?.content ?? []) ?? [];

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCatalogBrowse('products');
  };

  return {
    search,
    setSearch,
    selectedCategoryId,
    setSelectedCategoryId,
    catalogBrowse,
    setCatalogBrowse,
    searchActive,
    categories,
    categoriesLoading,
    categoriesError,
    products,
    productsLoading,
    productsError,
    productsLoadingMore,
    productsHasMore,
    fetchMoreProducts,
    handleSelectCategory,
  };
}

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ALL_CATEGORY_ID } from '../usePosCatalogPanel';
import { useConnectivityStore } from '../../../../store/connectivityStore';
import {
  fetchPosCategories,
  fetchPosProductsPage,
  getPosCatalogMode,
  getPosProductsNextPageParam,
} from '../../../../services/offline/posCatalogFetchService';
import { isDesktopOfflineBridge } from '../../../../services/offline/desktopOfflineBridge';

export function usePosProductsCatalog({ storeId }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [catalogBrowse, setCatalogBrowse] = useState('categories');
  const catalogMode = getPosCatalogMode();
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);
  const prevCatalogModeRef = useRef(catalogMode);

  const searchActive = search.trim().length > 0;
  const categoryFilterId =
    searchActive || selectedCategoryId === ALL_CATEGORY_ID
      ? undefined
      : selectedCategoryId;

  const productsEnabled =
    !!storeId && (searchActive || catalogBrowse === 'products');

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !storeId) return undefined;
    const prev = prevCatalogModeRef.current;
    if (prev !== catalogMode) {
      qc.invalidateQueries({ queryKey: ['pos-categories'] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
    }
    prevCatalogModeRef.current = catalogMode;
  }, [catalogMode, storeId, qc]);

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !storeId) return undefined;
    let prevApiOnline = apiOnline;
    const unsub = useConnectivityStore.subscribe((state) => {
      if (state.apiOnline !== prevApiOnline) {
        qc.invalidateQueries({ queryKey: ['pos-categories'] });
        qc.invalidateQueries({ queryKey: ['pos-products'] });
        prevApiOnline = state.apiOnline;
      }
    });
    return unsub;
  }, [storeId, apiOnline, qc]);

  const {
    data: categories = [],
    isPending: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ['pos-categories', catalogMode],
    queryFn: fetchPosCategories,
    enabled: !!storeId,
    retry: catalogMode === 'offline' ? false : 1,
    staleTime: catalogMode === 'offline' ? Infinity : 0,
  });

  const {
    data: productsPages,
    isPending: productsLoading,
    isError: productsError,
    isFetchingNextPage: productsLoadingMore,
    hasNextPage: productsHasMore,
    fetchNextPage: fetchMoreProducts,
  } = useInfiniteQuery({
    queryKey: [
      'pos-products',
      storeId,
      categoryFilterId,
      search.trim(),
      catalogMode,
      bootstrapReady,
    ],
    queryFn: ({ pageParam }) =>
      fetchPosProductsPage({
        storeId,
        categoryId: categoryFilterId,
        search,
        pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      getPosProductsNextPageParam(lastPage, lastPageParam),
    enabled: productsEnabled,
    retry: catalogMode === 'offline' ? false : 1,
    staleTime: catalogMode === 'offline' ? Infinity : 0,
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

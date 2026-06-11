import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ALL_CATEGORY_ID } from '../usePosCatalogPanel';
import { markApiUnreachable, useConnectivityStore } from '../../../../store/connectivityStore';
import {
  fetchPosCategories,
  fetchPosProductsPage,
  getPosCatalogMode,
  getPosProductsNextPageParam,
} from '../../../../services/offline/posCatalogFetchService';
import { isDesktopOfflineBridge } from '../../../../services/offline/desktopOfflineBridge';

function invalidatePosCatalogQueries(qc) {
  qc.cancelQueries({ queryKey: ['pos-categories'] });
  qc.cancelQueries({ queryKey: ['pos-products'] });
  qc.invalidateQueries({ queryKey: ['pos-categories'] });
  qc.invalidateQueries({ queryKey: ['pos-products'] });
}

export function usePosProductsCatalog({ storeId }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [catalogBrowse, setCatalogBrowse] = useState('categories');
  const catalogMode = getPosCatalogMode(storeId);
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);
  const productCount = useConnectivityStore((s) => s.productCount);
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
      invalidatePosCatalogQueries(qc);
    }
    prevCatalogModeRef.current = catalogMode;
  }, [catalogMode, storeId, qc]);

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !storeId) return undefined;
    let prevApiOnline = apiOnline;
    const unsub = useConnectivityStore.subscribe((state) => {
      if (state.apiOnline !== prevApiOnline) {
        invalidatePosCatalogQueries(qc);
        prevApiOnline = state.apiOnline;
      }
    });
    return unsub;
  }, [storeId, apiOnline, qc]);

  useEffect(() => {
    if (!isDesktopOfflineBridge() || typeof window === 'undefined') return undefined;
    const onBrowserOffline = () => {
      markApiUnreachable();
      invalidatePosCatalogQueries(qc);
    };
    window.addEventListener('offline', onBrowserOffline);
    return () => window.removeEventListener('offline', onBrowserOffline);
  }, [qc]);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ['pos-categories', storeId, catalogMode],
    queryFn: ({ signal }) => fetchPosCategories({ storeId, signal }),
    enabled: !!storeId,
    retry: catalogMode === 'offline' ? false : 1,
    staleTime: catalogMode === 'offline' ? Infinity : 0,
  });

  const {
    data: productsPages,
    isLoading: productsLoading,
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
      productCount,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchPosProductsPage({
        storeId,
        categoryId: categoryFilterId,
        search,
        pageParam,
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      getPosProductsNextPageParam(lastPage, lastPageParam, storeId),
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

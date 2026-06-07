import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { categoryApi, productApi } from '../../services/api';
import { ALL_CATEGORY_ID } from '../../components/cashier/PosCatalogPanel';
import { POS_PRODUCT_PAGE_SIZE } from '../../components/cashier/pos/posCatalogConstants';
import { useConnectivityStore } from '../../store/connectivityStore';
import { offlineListCategories, offlineSearchProducts } from '../../services/offline/desktopOfflineBridge';

export function usePosProductsCatalog({ storeId, posPane }) {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [catalogBrowse, setCatalogBrowse] = useState('categories');
  const offlinePos = useConnectivityStore((s) => s.offlineMode && s.canSellOffline);

  const searchActive = search.trim().length > 0;
  const categoryFilterId =
    searchActive || selectedCategoryId === ALL_CATEGORY_ID
      ? undefined
      : selectedCategoryId;

  const productsEnabled =
    !!storeId && posPane === 'catalog' && (searchActive || catalogBrowse === 'products');

  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: ['pos-categories', offlinePos ? 'offline' : 'online'],
    queryFn: () =>
      offlinePos
        ? offlineListCategories()
        : categoryApi.getAll().then((r) => r.data),
    enabled: !!storeId,
  });

  const {
    data: productsPages,
    isPending: productsLoading,
    isFetchingNextPage: productsLoadingMore,
    hasNextPage: productsHasMore,
    fetchNextPage: fetchMoreProducts,
  } = useInfiniteQuery({
    queryKey: ['pos-products', storeId, categoryFilterId, search.trim(), offlinePos ? 'offline' : 'online'],
    queryFn: async ({ pageParam }) => {
      if (offlinePos) {
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
      return next < total ? (offlinePos ? lastPageParam + POS_PRODUCT_PAGE_SIZE : next) : undefined;
    },
    enabled: productsEnabled,
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
    products,
    productsLoading,
    productsLoadingMore,
    productsHasMore,
    fetchMoreProducts,
    handleSelectCategory,
  };
}

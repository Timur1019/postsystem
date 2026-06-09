import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ALL_CATEGORY_ID = 'all';
const SCROLL_LOAD_THRESHOLD_PX = 96;

export function usePosCatalogPanel({
  search,
  onSearchChange,
  onSelectCategory,
  categories,
  selectedCategoryId,
  searchActive,
  catalogBrowse,
  onBrowseChange,
  products,
  productsLoading,
  productsLoadingMore,
  productsHasMore,
  onLoadMoreProducts,
  viewMode,
}) {
  const { t } = useTranslation();
  const [narrowSearch, setNarrowSearch] = useState(false);
  const catalogBodyRef = useRef(null);

  const showCategories = !searchActive && catalogBrowse === 'categories';
  const showProducts = searchActive || catalogBrowse === 'products';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 520px)');
    const sync = () => setNarrowSearch(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (searchActive && catalogBrowse !== 'products') {
      onBrowseChange?.('products');
    }
  }, [searchActive, catalogBrowse, onBrowseChange]);

  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const productsTitle = searchActive
    ? t('pos.searchProducts')
    : selectedCategoryId === ALL_CATEGORY_ID
      ? t('pos.allProducts')
      : selectedCategory?.name ?? t('pos.pickCategory');

  const openCategory = (categoryId) => {
    onSelectCategory(categoryId);
    onBrowseChange?.('products');
  };

  const goBackToCategories = () => {
    onBrowseChange?.('categories');
    onSearchChange('');
  };

  useEffect(() => {
    catalogBodyRef.current?.scrollTo(0, 0);
  }, [selectedCategoryId, search, catalogBrowse, searchActive]);

  const handleCatalogScroll = useCallback(() => {
    const el = catalogBodyRef.current;
    if (!el || productsLoading || productsLoadingMore || !productsHasMore) return;
    const nearBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_LOAD_THRESHOLD_PX;
    if (nearBottom) onLoadMoreProducts?.();
  }, [productsLoading, productsLoadingMore, productsHasMore, onLoadMoreProducts]);

  useEffect(() => {
    if (!showProducts || productsLoading || productsLoadingMore || !productsHasMore) return;
    const el = catalogBodyRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + SCROLL_LOAD_THRESHOLD_PX) {
      onLoadMoreProducts?.();
    }
  }, [
    showProducts,
    products.length,
    productsLoading,
    productsLoadingMore,
    productsHasMore,
    onLoadMoreProducts,
    viewMode,
  ]);

  const handleSearchInput = (value) => {
    onSearchChange(value);
    if (value.trim()) {
      onBrowseChange?.('products');
    }
  };

  return {
    t,
    narrowSearch,
    catalogBodyRef,
    showCategories,
    showProducts,
    productsTitle,
    openCategory,
    goBackToCategories,
    handleCatalogScroll,
    handleSearchInput,
  };
}

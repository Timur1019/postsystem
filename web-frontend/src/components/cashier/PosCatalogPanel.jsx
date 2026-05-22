// src/components/cashier/PosCatalogPanel.jsx
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, FolderOpen, LayoutGrid, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../utils/formatMoney';

export const ALL_CATEGORY_ID = 'all';

const SCROLL_LOAD_THRESHOLD_PX = 96;

const PosCatalogPanel = forwardRef(function PosCatalogPanel(
  {
    search,
    onSearchChange,
    onSearchEnter,
    scanDisabled = false,
    categories,
    categoriesLoading,
    selectedCategoryId,
    onSelectCategory,
    searchActive,
    catalogBrowse,
    onBrowseChange,
    products,
    productsLoading,
    productsLoadingMore = false,
    productsHasMore = false,
    onLoadMoreProducts,
    onAddProduct,
    viewMode = 'grid',
  },
  searchInputRef
) {
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

  /** Если первая порция не заполняет экран — догружаем следующие страницы. */
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

  const renderProduct = (p) => {
    if (viewMode === 'list') {
      return (
        <button key={p.id} type="button" className="pos-product-row" onClick={() => onAddProduct(p)}>
          <div className="pos-product-row__main">
            <span className="pos-product-row__name">{p.name}</span>
            {p.sku ? (
              <span className="pos-product-row__code">
                {t('pos.productCode')}: {p.sku}
              </span>
            ) : null}
          </div>
          <span className="pos-product-row__price">{fmt(p.sellingPrice)}</span>
        </button>
      );
    }
    return (
      <button key={p.id} type="button" className="pos-product-card" onClick={() => onAddProduct(p)}>
        <span className="pos-product-card__price">{fmt(p.sellingPrice)}</span>
        {p.sku ? <span className="pos-product-card__code">{p.sku}</span> : null}
        <span className="pos-product-card__name">{p.name}</span>
      </button>
    );
  };

  return (
    <section className="pos-catalog-panel">
      <header className="pos-catalog-panel__head">
        <div className="pos-search-bar__field">
          <Search size={20} className="pos-search-bar__icon" aria-hidden />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchEnter?.();
              }
            }}
            disabled={scanDisabled}
            placeholder={t(narrowSearch ? 'pos.searchProductsPhShort' : 'pos.searchProductsPh')}
            autoComplete="off"
            className="pos-search-bar__input"
          />
        </div>
      </header>

      {showProducts && !searchActive ? (
        <div className="pos-catalog-toolbar">
          <button type="button" className="pos-catalog-toolbar__back" onClick={goBackToCategories}>
            <ArrowLeft size={18} aria-hidden />
            {t('pos.backToCategories')}
          </button>
          <h2 className="pos-catalog-toolbar__title">{productsTitle}</h2>
        </div>
      ) : null}

      {searchActive ? (
        <div className="pos-catalog-toolbar pos-catalog-toolbar--search">
          <h2 className="pos-catalog-toolbar__title">{t('pos.searchProducts')}</h2>
        </div>
      ) : null}

      <div ref={catalogBodyRef} className="pos-catalog-panel__body" onScroll={handleCatalogScroll}>
        {showCategories ? (
          categoriesLoading ? (
            <p className="pos-catalog-panel__empty">{t('common.loading')}</p>
          ) : (
            <div className="pos-category-browse">
              <button
                type="button"
                className="pos-category-tile pos-category-tile--all"
                onClick={() => openCategory(ALL_CATEGORY_ID)}
              >
                <span className="pos-category-tile__icon" aria-hidden>
                  <LayoutGrid size={26} strokeWidth={1.75} />
                </span>
                <span className="pos-category-tile__name">{t('pos.allProducts')}</span>
                <span className="pos-category-tile__hint">{t('pos.openAllProductsHint')}</span>
              </button>
              {!categories?.length ? (
                <p className="pos-catalog-panel__empty pos-category-browse__empty">{t('pos.noCategories')}</p>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className="pos-category-tile"
                    onClick={() => openCategory(cat.id)}
                  >
                    <span className="pos-category-tile__icon" aria-hidden>
                      <FolderOpen size={26} strokeWidth={1.75} />
                    </span>
                    <span className="pos-category-tile__name">{cat.name}</span>
                  </button>
                ))
              )}
            </div>
          )
        ) : showProducts ? (
          <>
            {searchActive ? (
              <p className="pos-catalog-panel__hint">{t('pos.searchAllCategories')}</p>
            ) : null}
            {productsLoading ? (
              <p className="pos-catalog-panel__empty">{t('common.loading')}</p>
            ) : products.length === 0 ? (
              <p className="pos-catalog-panel__empty">{t('pos.noProductsInCategory')}</p>
            ) : viewMode === 'list' ? (
              <div className="pos-product-list">{products.map(renderProduct)}</div>
            ) : (
              <div className="pos-product-grid">{products.map(renderProduct)}</div>
            )}
            {productsLoadingMore ? (
              <p className="pos-catalog-panel__load-more" role="status">
                {t('pos.loadingMoreProducts')}
              </p>
            ) : null}
            {!productsLoadingMore && productsHasMore && products.length > 0 ? (
              <p className="pos-catalog-panel__load-more-hint">{t('pos.scrollForMoreProducts')}</p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
});

export default PosCatalogPanel;

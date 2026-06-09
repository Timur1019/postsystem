import { forwardRef } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { usePosCatalogPanel } from '../hooks/usePosCatalogPanel';
import PosCatalogCategoryBrowse from './pos-catalog/PosCatalogCategoryBrowse';
import PosCatalogProductBrowse from './pos-catalog/PosCatalogProductBrowse';

export { ALL_CATEGORY_ID } from '../hooks/usePosCatalogPanel';

const PosCatalogPanel = forwardRef(function PosCatalogPanel(
  {
    search,
    onSearchChange,
    onSearchEnter,
    scanDisabled = false,
    categories,
    categoriesLoading,
    categoriesError = false,
    selectedCategoryId,
    onSelectCategory,
    searchActive,
    catalogBrowse,
    onBrowseChange,
    products,
    productsLoading,
    productsError = false,
    productsLoadingMore = false,
    productsHasMore = false,
    onLoadMoreProducts,
    onAddProduct,
    viewMode = 'grid',
  },
  searchInputRef
) {
  const panel = usePosCatalogPanel({
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
  });

  return (
    <section className="pos-catalog-panel">
      <header className="pos-catalog-panel__head">
        <div className="pos-search-bar__field">
          <Search size={20} className="pos-search-bar__icon" aria-hidden />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => panel.handleSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchEnter?.();
              }
            }}
            disabled={scanDisabled}
            placeholder={panel.t(
              panel.narrowSearch ? 'pos.searchProductsPhShort' : 'pos.searchProductsPh'
            )}
            autoComplete="off"
            className="pos-search-bar__input"
          />
        </div>
      </header>

      {panel.showProducts && !searchActive ? (
        <div className="pos-catalog-toolbar">
          <button type="button" className="pos-catalog-toolbar__back" onClick={panel.goBackToCategories}>
            <ArrowLeft size={18} aria-hidden />
            {panel.t('pos.backToCategories')}
          </button>
          <h2 className="pos-catalog-toolbar__title">{panel.productsTitle}</h2>
        </div>
      ) : null}

      {searchActive ? (
        <div className="pos-catalog-toolbar pos-catalog-toolbar--search">
          <h2 className="pos-catalog-toolbar__title">{panel.t('pos.searchProducts')}</h2>
        </div>
      ) : null}

      <div
        ref={panel.catalogBodyRef}
        className="pos-catalog-panel__body"
        onScroll={panel.handleCatalogScroll}
      >
        {panel.showCategories ? (
          <PosCatalogCategoryBrowse
            t={panel.t}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            onOpenCategory={panel.openCategory}
          />
        ) : panel.showProducts ? (
          <PosCatalogProductBrowse
            t={panel.t}
            searchActive={searchActive}
            products={products}
            productsLoading={productsLoading}
            productsError={productsError}
            productsLoadingMore={productsLoadingMore}
            productsHasMore={productsHasMore}
            viewMode={viewMode}
            onAddProduct={onAddProduct}
          />
        ) : null}
      </div>
    </section>
  );
});

export default PosCatalogPanel;

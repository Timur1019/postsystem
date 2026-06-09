import { renderPosCatalogProduct } from './posCatalogRenderProduct';

export default function PosCatalogProductBrowse({
  t,
  searchActive,
  products,
  productsLoading,
  productsError,
  productsLoadingMore,
  productsHasMore,
  viewMode,
  onAddProduct,
}) {
  if (productsLoading) {
    return <p className="pos-catalog-panel__empty">{t('common.loading')}</p>;
  }

  if (productsError) {
    return <p className="pos-catalog-panel__empty">{t('offline.catalogLoadFailed')}</p>;
  }

  if (products.length === 0) {
    return <p className="pos-catalog-panel__empty">{t('pos.noProductsInCategory')}</p>;
  }

  const renderProduct = (p) =>
    renderPosCatalogProduct(p, { viewMode, t, onAddProduct });

  return (
    <>
      {searchActive ? (
        <p className="pos-catalog-panel__hint">{t('pos.searchAllCategories')}</p>
      ) : null}
      {viewMode === 'list' ? (
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
  );
}

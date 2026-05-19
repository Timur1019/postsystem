// src/components/cashier/PosCatalogPanel.jsx
import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../utils/formatMoney';

export const ALL_CATEGORY_ID = 'all';

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
    products,
    productsLoading,
    onAddProduct,
  },
  searchInputRef
) {
  const { t } = useTranslation();

  const pillClass = (active) => `pos-category-nav__pill${active ? ' is-active' : ''}`;

  return (
    <section className="pos-catalog-panel">
      <header className="pos-catalog-panel__head">
        <div className="pos-search-bar__field">
          <Search size={20} className="pos-search-bar__icon" aria-hidden />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchEnter?.();
              }
            }}
            disabled={scanDisabled}
            placeholder={t('pos.searchProductsPh')}
            autoComplete="off"
            className="pos-search-bar__input"
          />
        </div>
      </header>

      {!categoriesLoading && categories.length > 0 && (
        <nav className="pos-category-nav" aria-label={t('pos.pickCategory')}>
          <button
            type="button"
            className={pillClass(selectedCategoryId === ALL_CATEGORY_ID && !searchActive)}
            onClick={() => onSelectCategory(ALL_CATEGORY_ID)}
          >
            {t('pos.allProducts')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={pillClass(selectedCategoryId === cat.id && !searchActive)}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      )}

      <div className="pos-catalog-panel__body">
        {searchActive && <p className="pos-catalog-panel__hint">{t('pos.searchAllCategories')}</p>}
        {categoriesLoading || productsLoading ? (
          <p className="pos-catalog-panel__empty">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="pos-catalog-panel__empty">{t('pos.noProductsInCategory')}</p>
        ) : (
          <div className="pos-product-grid">
            {products.map((p) => (
              <button key={p.id} type="button" className="pos-product-card" onClick={() => onAddProduct(p)}>
                <span className="pos-product-card__name">{p.name}</span>
                {p.sku ? (
                  <span className="pos-product-card__code">
                    {t('pos.productCode')}: {p.sku}
                  </span>
                ) : null}
                <span className="pos-product-card__price">{fmt(p.sellingPrice)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default PosCatalogPanel;

// src/components/cashier/PosCatalogPanel.jsx
import { LayoutGrid, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

export default function PosCatalogPanel({
  search,
  onSearchChange,
  onSearchEnter,
  categories,
  categoriesLoading,
  selectedCategoryId,
  onSelectCategory,
  onBackToCategories,
  showCategoryPicker,
  searchActive,
  products,
  productsLoading,
  categoryName,
  onAddProduct,
}) {
  const { t } = useTranslation();

  return (
    <section className="pos-catalog-panel">
      <div className="pos-search-row">
        <Search size={16} className="pos-search-row__icon" aria-hidden />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchEnter?.();
            }
          }}
          placeholder={t('pos.searchProducts')}
          className="pos-search flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {showCategoryPicker ? (
        <div className="pos-categories-panel">
          <p className="pos-categories-panel__title">
            <LayoutGrid size={18} aria-hidden />
            {t('pos.pickCategory')}
          </p>
          {categoriesLoading ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-500">{t('pos.noCategories')}</p>
          ) : (
            <div className="pos-category-grid">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="pos-category-card"
                  onClick={() => onSelectCategory(cat.id)}
                >
                  <span className="pos-category-card__abbr">
                    {cat.name
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span className="pos-category-card__name">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {!searchActive && selectedCategoryId != null && (
            <div className="pos-category-bar">
              <button type="button" className="pos-category-back" onClick={onBackToCategories}>
                ← {t('pos.backToCategories')}
              </button>
              <span className="pos-category-bar__current">{categoryName}</span>
            </div>
          )}
          {searchActive && (
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{t('pos.searchAllCategories')}</p>
          )}
          {productsLoading ? (
            <p className="text-slate-500">{t('common.loading')}</p>
          ) : products.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              {t('pos.noProductsInCategory')}
            </p>
          ) : (
            <div className="pos-products-scroll">
              <div className="pos-product-grid">
                {products.map((p) => (
                  <button key={p.id} type="button" onClick={() => onAddProduct(p)} className="pos-product-card">
                    <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                    <p className="mt-2 font-bold text-emerald-600">{fmt(p.sellingPrice)}</p>
                    {Number(p.defaultDiscountPercent) > 0 && (
                      <p className="text-xs font-medium text-amber-600">
                        {t('pos.catalogDiscount', { pct: p.defaultDiscountPercent })}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {t('pos.stock')}: {p.stockQuantity}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

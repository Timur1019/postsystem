import { FolderOpen, LayoutGrid } from 'lucide-react';
import { ALL_CATEGORY_ID } from '../../hooks/usePosCatalogPanel';

export default function PosCatalogCategoryBrowse({
  t,
  categories,
  categoriesLoading,
  categoriesError,
  onOpenCategory,
}) {
  if (categoriesLoading) {
    return <p className="pos-catalog-panel__empty">{t('common.loading')}</p>;
  }

  if (categoriesError) {
    return <p className="pos-catalog-panel__empty">{t('offline.catalogLoadFailed')}</p>;
  }

  return (
    <div className="pos-category-browse">
      <button
        type="button"
        className="pos-category-tile pos-category-tile--all"
        onClick={() => onOpenCategory(ALL_CATEGORY_ID)}
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
            onClick={() => onOpenCategory(cat.id)}
          >
            <span className="pos-category-tile__icon" aria-hidden>
              <FolderOpen size={26} strokeWidth={1.75} />
            </span>
            <span className="pos-category-tile__name">{cat.name}</span>
          </button>
        ))
      )}
    </div>
  );
}

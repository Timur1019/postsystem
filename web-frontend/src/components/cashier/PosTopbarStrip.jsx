import { FolderOpen, LayoutGrid, List, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePosShell } from '../../contexts/PosShellContext';

export default function PosTopbarStrip() {
  const { t } = useTranslation();
  const { shell } = usePosShell() ?? {};

  if (!shell) return null;

  const {
    catalogBrowse,
    onOpenCategories,
    onOpenProducts,
    searchActive,
    viewMode,
    onViewModeChange,
  } = shell;

  const onCategories = catalogBrowse === 'categories' && !searchActive;
  const onProducts = catalogBrowse === 'products' || searchActive;
  const showViewToggle = onProducts;

  return (
    <div className="pos-topbar-strip">
      <div className="pos-topbar-nav" role="group" aria-label={t('pos.catalogNavLabel')}>
        <button
          type="button"
          className={`pos-topbar-nav__btn${onCategories ? ' is-active' : ''}`}
          onClick={onOpenCategories}
          aria-pressed={onCategories}
        >
          <FolderOpen size={18} aria-hidden />
          <span>{t('pos.navCategories')}</span>
        </button>
        <button
          type="button"
          className={`pos-topbar-nav__btn${onProducts ? ' is-active' : ''}`}
          onClick={onOpenProducts}
          aria-pressed={onProducts}
        >
          <Package size={18} aria-hidden />
          <span>{t('pos.navProducts')}</span>
        </button>
      </div>

      {showViewToggle ? (
        <div className="pos-topbar-views" role="group" aria-label={t('pos.viewModeLabel')}>
          <button
            type="button"
            className={`pos-topbar-views__btn${viewMode === 'grid' ? ' is-active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title={t('pos.viewAsCards')}
          >
            <LayoutGrid size={18} aria-hidden />
          </button>
          <button
            type="button"
            className={`pos-topbar-views__btn${viewMode === 'list' ? ' is-active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title={t('pos.viewAsList')}
          >
            <List size={18} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

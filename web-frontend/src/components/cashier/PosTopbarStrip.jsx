import { LayoutGrid, List, Package, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePosShell } from '../../contexts/PosShellContext';

export default function PosTopbarStrip() {
  const { t } = useTranslation();
  const { shell } = usePosShell() ?? {};

  if (!shell) return null;

  const { posPane, onGoToRegister, onGoToCatalog, catalogBrowse, searchActive, viewMode, onViewModeChange } =
    shell;

  if (posPane === 'register') {
    return (
      <div className="pos-topbar-strip">
        <button
          type="button"
          className="pos-topbar-nav__btn pos-topbar-nav__btn--catalog"
          onClick={onGoToCatalog}
        >
          <Package size={18} aria-hidden />
          <span>{t('pos.tabCatalog')}</span>
        </button>
      </div>
    );
  }

  const showViewToggle = !searchActive && catalogBrowse === 'products';

  return (
    <div className="pos-topbar-strip pos-topbar-strip--catalog">
      <button
        type="button"
        className="pos-topbar-close"
        onClick={onGoToRegister}
        aria-label={t('common.close')}
        title={t('pos.backToRegister')}
      >
        <X size={20} strokeWidth={2} aria-hidden />
      </button>

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

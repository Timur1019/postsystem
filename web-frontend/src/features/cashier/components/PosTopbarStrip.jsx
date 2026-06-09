import { LayoutGrid, List, Package, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePosShell } from '../../../contexts/PosShellContext';

export default function PosTopbarStrip() {
  const { t } = useTranslation();
  const { shell } = usePosShell() ?? {};

  if (!shell) return null;

  const {
    posPane,
    payOpen,
    onGoToRegister,
    onGoToCatalog,
    catalogBrowse,
    searchActive,
    viewMode,
    onViewModeChange,
  } = shell;

  /** На чеке / в оплате: кнопка «Товары» → каталог */
  const showProductsBtn = posPane === 'register';
  /** На каталоге: кнопка «Касса» → чек */
  const showCheckBtn = posPane === 'catalog' && !payOpen;
  const showViewToggle = posPane === 'catalog' && !searchActive && catalogBrowse === 'products' && !payOpen;

  if (!showProductsBtn && !showCheckBtn && !showViewToggle) {
    return null;
  }

  return (
    <div className="pos-topbar-strip pos-topbar-strip--nav">
      {showProductsBtn ? (
        <button
          type="button"
          className="pos-topbar-nav__btn pos-topbar-nav__btn--catalog"
          onClick={onGoToCatalog}
          aria-label={t('pos.tabCatalog')}
          title={t('pos.backToProducts')}
        >
          <Package size={18} strokeWidth={2} aria-hidden />
          <span>{t('pos.tabCatalog')}</span>
        </button>
      ) : null}

      {showCheckBtn ? (
        <button
          type="button"
          className="pos-topbar-nav__btn pos-topbar-nav__btn--register"
          onClick={onGoToRegister}
          aria-label={t('pos.tabRegister')}
          title={t('pos.backToRegister')}
        >
          <Receipt size={18} strokeWidth={2} aria-hidden />
          <span>{t('pos.tabRegister')}</span>
        </button>
      ) : null}

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

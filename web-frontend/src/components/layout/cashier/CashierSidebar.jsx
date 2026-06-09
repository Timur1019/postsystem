import { NavLink } from 'react-router-dom';
import {
  ShoppingCart,
  Receipt,
  LogOut,
  BookOpen,
  Clock,
  Store,
  Menu,
  PanelLeftClose,
  Headphones,
  Lock,
} from 'lucide-react';
import { CashierThemeToggle } from '../../../features/cashier';

export default function CashierSidebar({
  t,
  sidebarClass,
  sidebarNavExpanded,
  displayAppName,
  storeId,
  storeName,
  storeLoading,
  storeError,
  navLinkClass,
  openShift,
  lock,
  toggleSidebar,
  sidebarOpen,
  cashierTheme,
  toggleCashierTheme,
  onLogout,
}) {
  return (
    <aside className={sidebarClass}>
      <div className="cashier-sidebar__head">
        <p className="cashier-sidebar__brand">{displayAppName()}</p>
        {storeId ? (
          <div className="cashier-sidebar__store" title={storeName || undefined}>
            <Store size={20} className="cashier-sidebar__store-icon" aria-hidden />
            {sidebarNavExpanded ? (
              <div className="cashier-sidebar__store-text">
                <span className="cashier-sidebar__store-label">{t('pos.assignedStore')}</span>
                <span className="cashier-sidebar__store-name">
                  {storeLoading
                    ? t('common.loading')
                    : storeError
                      ? t('pos.storeLoadFailed')
                      : storeName || '—'}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <nav className="cashier-sidebar__nav nav nav-pills flex-column">
        <NavLink to="/cashier/pos" className={navLinkClass} end title={t('pos.navSale')}>
          <ShoppingCart size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
          {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('pos.navSale')}</span> : null}
        </NavLink>
        <NavLink to="/cashier/sales" className={navLinkClass} title={t('pos.navMySales')}>
          <Receipt size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
          {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('pos.navMySales')}</span> : null}
        </NavLink>
        <button
          type="button"
          className="nav-link cashier-sidebar__nav-btn"
          onClick={openShift}
          disabled={!storeId}
          title={t('pos.navShift')}
        >
          <Clock size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
          {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('pos.navShift')}</span> : null}
        </button>
        <NavLink to="/cashier/handbook/cashierPos" className={navLinkClass} title={t('nav.handbook')}>
          <BookOpen size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
          {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('nav.handbook')}</span> : null}
        </NavLink>
        <NavLink to="/cashier/support" className={navLinkClass} title={t('nav.support')}>
          <Headphones size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
          {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('nav.support')}</span> : null}
        </NavLink>
      </nav>

      <div className="cashier-sidebar__foot">
        <CashierThemeToggle theme={cashierTheme} onToggle={toggleCashierTheme} />
        <button
          type="button"
          className="cashier-sidebar__lock"
          onClick={lock}
          title={t('pos.lockScreen')}
        >
          <Lock size={20} strokeWidth={2} />
          {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('pos.lockScreen')}</span> : null}
        </button>
        <button
          type="button"
          className="cashier-sidebar__toggle"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? t('nav.collapseMenu') : t('nav.expandMenu')}
          title={sidebarOpen ? t('nav.collapseMenu') : t('nav.expandMenu')}
        >
          {sidebarOpen ? <PanelLeftClose size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          {sidebarNavExpanded ? (
            <span className="cashier-sidebar__label">
              {sidebarOpen ? t('nav.collapseMenu') : t('nav.expandMenu')}
            </span>
          ) : null}
        </button>
        <button type="button" className="cashier-sidebar__logout" onClick={onLogout} title={t('nav.logout')}>
          <LogOut size={20} strokeWidth={2} />
          {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('nav.logout')}</span> : null}
        </button>
      </div>
    </aside>
  );
}

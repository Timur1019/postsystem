import { NavLink } from 'react-router-dom';

export default function CashierMobileNav({ t, openShift, storeId, lock, onLogout }) {
  return (
    <nav className="nav nav-pills d-lg-none gap-1 cashier-topbar__mobile-nav">
      <NavLink to="/cashier/pos" className="nav-link py-1 px-2 small">
        {t('pos.navSale')}
      </NavLink>
      <NavLink to="/cashier/sales" className="nav-link py-1 px-2 small">
        {t('pos.navMySales')}
      </NavLink>
      <button
        type="button"
        className="nav-link py-1 px-2 small"
        onClick={openShift}
        disabled={!storeId}
      >
        {t('pos.navShift')}
      </button>
      <button type="button" className="nav-link py-1 px-2 small" onClick={lock}>
        {t('pos.lockScreen')}
      </button>
      <button type="button" className="nav-link py-1 px-2 small" onClick={onLogout}>
        {t('nav.logout')}
      </button>
    </nav>
  );
}

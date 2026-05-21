// src/components/layout/CashierLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Receipt, LogOut, BookOpen, Clock, Store, Menu, PanelLeftClose, Headphones, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useCashierStore } from '../../hooks/useCashierStore';
import { CashierShiftModalProvider, useCashierShiftModal } from '../../contexts/CashierShiftModalContext';
import { CashierLockProvider, useCashierLock } from '../../contexts/CashierLockContext';
import CashierLockOverlay from '../cashier/CashierLockOverlay';
import { clearCashierScreenLocked } from '../../utils/cashierLock';
import { PosShellProvider } from '../../contexts/PosShellContext';
import CashierShiftModal from '../cashier/CashierShiftModal';
import PosTopbarStrip from '../cashier/PosTopbarStrip';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import BrandMark from '../shared/BrandMark';
import { useCashierShift } from '../../hooks/useCashierShift';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/cashier-modals.css';
import '../../styles/cashier-bootstrap.css';
import '../../styles/cashier-responsive.css';

function displayName(user) {
  if (!user) return '';
  const parts = [user.lastName, user.firstName, user.patronymic].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.username ?? '';
}

const CASHIER_SIDEBAR_KEY = 'cashier-sidebar-open';

function readSidebarOpen() {
  try {
    const v = localStorage.getItem(CASHIER_SIDEBAR_KEY);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return true;
}

function CashierLayoutShell() {
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen);
  const [sidebarNavExpanded, setSidebarNavExpanded] = useState(readSidebarOpen);

  useEffect(() => {
    document.documentElement.classList.remove('pos-pay-screen-open', 'cashier-theme--light', 'cashier-theme--dark');
    document.body.classList.remove('pos-pay-screen-open');
    try {
      localStorage.removeItem('pos-cashier-theme');
    } catch {
      /* ignore */
    }
  }, []);

  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { storeId, storeName, storeLoading, storeError } = useCashierStore();
  const { open, openShift, closeShift } = useCashierShiftModal();
  const { lock } = useCashierLock();
  const navigate = useNavigate();
  const location = useLocation();
  const isPosRoute = location.pathname.startsWith('/cashier/pos');

  /** На экране кассы <800px — сворачиваем боковое меню, остаётся верхняя навигация */
  useEffect(() => {
    if (!isPosRoute) return;
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 799px)');
    const apply = () => {
      if (mq.matches) {
        setSidebarOpen(false);
        setSidebarNavExpanded(false);
      }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [isPosRoute]);
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  const { data: shift } = useCashierShift(storeId);

  const navLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`;

  const handleLogout = () => {
    clearCashierScreenLocked(user?.id);
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    setSidebarNavExpanded(next);
    try {
      localStorage.setItem(CASHIER_SIDEBAR_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const sidebarClass = `cashier-sidebar d-none d-lg-flex flex-column${sidebarOpen ? '' : ' is-collapsed'}`;

  return (
    <div
      className={`cashier-app d-flex bg-light${sidebarOpen ? '' : ' cashier-app--sidebar-collapsed'}${
        isPosRoute ? ' cashier-app--pos-screen' : ''
      }`}
    >
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
          <button type="button" className="cashier-sidebar__logout" onClick={handleLogout} title={t('nav.logout')}>
            <LogOut size={20} strokeWidth={2} />
            {sidebarNavExpanded ? <span className="cashier-sidebar__label">{t('nav.logout')}</span> : null}
          </button>
        </div>
      </aside>

      <div className="d-flex flex-column flex-grow-1 min-vw-0 min-h-0">
        {isPosRoute ? (
          <PosShellProvider>
            <header className="cashier-topbar cashier-topbar--pos border-bottom px-3 py-2">
              <div className="cashier-topbar__row cashier-topbar__row--main">
                <div className="cashier-topbar__brand-block">
                  <button
                    type="button"
                    className="cashier-topbar__menu d-none d-lg-inline-flex"
                    onClick={toggleSidebar}
                    aria-label={sidebarOpen ? t('nav.collapseMenu') : t('nav.expandMenu')}
                  >
                    {sidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
                  </button>
                  <p className="cashier-topbar__pos-title mb-0 fw-semibold">{t('pos.navSale')}</p>
                </div>
                <PosTopbarStrip />
                <div className="cashier-topbar__actions">
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
                    <button type="button" className="nav-link py-1 px-2 small" onClick={handleLogout}>
                      {t('nav.logout')}
                    </button>
                  </nav>
                  <LanguageSwitcher variant="cashier" className="cashier-topbar__lang" />
                </div>
              </div>
            </header>
            <main className="flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0">
              <Outlet />
            </main>
          </PosShellProvider>
        ) : (
          <>
            <header className="cashier-topbar border-bottom px-3 py-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2 min-w-0">
                <button
                  type="button"
                  className="cashier-topbar__menu d-none d-lg-inline-flex"
                  onClick={toggleSidebar}
                  aria-label={sidebarOpen ? t('nav.collapseMenu') : t('nav.expandMenu')}
                >
                  {sidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
                </button>
                <div className="d-lg-none min-w-0">
                  <p className="fw-semibold mb-0">{displayAppName()}</p>
                  <p className="text-muted small mb-0">{displayName(user)}</p>
                  {storeName ? (
                    <p className="text-success small mb-0 text-truncate">{storeName}</p>
                  ) : null}
                </div>
                <div className="d-none d-lg-block min-w-0">
                  {!sidebarOpen ? (
                    <p className="cashier-topbar__app-name mb-0 fw-bold">{displayAppName()}</p>
                  ) : null}
                  <p className={`mb-0 fw-medium${!sidebarOpen ? ' text-muted small' : ''}`}>
                    {displayName(user)}
                  </p>
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
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
                  <button type="button" className="nav-link py-1 px-2 small" onClick={handleLogout}>
                    {t('nav.logout')}
                  </button>
                </nav>
                <LanguageSwitcher variant="cashier" className="cashier-topbar__lang" />
              </div>
            </header>
            <main className="flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0">
              <Outlet />
            </main>
          </>
        )}
      </div>

      <CashierShiftModal
        open={open}
        onClose={closeShift}
        storeId={storeId}
        storeName={storeName}
        cashierName={displayName(user)}
        shift={shift}
      />
      <CashierLockOverlay />
    </div>
  );
}

export default function CashierLayout() {
  return (
    <CashierLockProvider>
      <CashierShiftModalProvider>
        <CashierLayoutShell />
      </CashierShiftModalProvider>
    </CashierLockProvider>
  );
}

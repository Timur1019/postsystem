// src/components/layout/CashierLayout.jsx
import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Receipt, LogOut, BookOpen, Clock, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useCashierStore } from '../../hooks/useCashierStore';
import { CashierShiftModalProvider, useCashierShiftModal } from '../../contexts/CashierShiftModalContext';
import CashierShiftModal from '../cashier/CashierShiftModal';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import { APP_NAME } from '../../config/brand';
import { cashierShiftApi } from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/cashier-modals.css';
import '../../styles/cashier-bootstrap.css';

function displayName(user) {
  if (!user) return '';
  const parts = [user.lastName, user.firstName, user.patronymic].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.username ?? '';
}

function CashierLayoutShell() {
  useEffect(() => {
    document.documentElement.classList.remove('pos-pay-screen-open');
    document.body.classList.remove('pos-pay-screen-open');
  }, []);

  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { storeId, storeName, storeLoading } = useCashierStore();
  const { open, openShift, closeShift } = useCashierShiftModal();
  const navigate = useNavigate();

  const { data: shift } = useQuery({
    queryKey: ['cashier-shift', storeId],
    queryFn: () => cashierShiftApi.current(storeId).then((r) => r.data),
    enabled: !!storeId,
    retry: 1,
  });

  const navLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="cashier-app d-flex min-vh-100 bg-light">
      <aside className="cashier-sidebar d-none d-md-flex flex-column">
        <div className="cashier-sidebar__head">
          <p className="cashier-sidebar__brand">{APP_NAME}</p>
          {storeId ? (
            <div className="cashier-sidebar__store">
              <Store size={20} className="cashier-sidebar__store-icon" aria-hidden />
              <div className="cashier-sidebar__store-text">
                <span className="cashier-sidebar__store-label">{t('pos.assignedStore')}</span>
                <span className="cashier-sidebar__store-name">
                  {storeLoading ? t('common.loading') : storeName || '—'}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <nav className="cashier-sidebar__nav nav nav-pills flex-column">
          <NavLink to="/cashier/pos" className={navLinkClass} end>
            <ShoppingCart size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
            <span>{t('pos.navSale')}</span>
          </NavLink>
          <NavLink to="/cashier/sales" className={navLinkClass}>
            <Receipt size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
            <span>{t('pos.navMySales')}</span>
          </NavLink>
          <button
            type="button"
            className="nav-link cashier-sidebar__nav-btn"
            onClick={openShift}
            disabled={!storeId || !shift}
          >
            <Clock size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
            <span>{t('pos.navShift')}</span>
          </button>
          <NavLink to="/cashier/handbook/cashierPos" className={navLinkClass}>
            <BookOpen size={20} strokeWidth={2} className="cashier-sidebar__nav-icon" />
            <span>{t('nav.handbook')}</span>
          </NavLink>
        </nav>

        <div className="cashier-sidebar__foot">
          <button type="button" className="cashier-sidebar__logout" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={2} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="d-flex flex-column flex-grow-1 min-vw-0 min-h-0">
        <header className="cashier-topbar border-bottom bg-white px-3 py-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-md-none min-w-0">
            <p className="fw-semibold mb-0">{APP_NAME}</p>
            <p className="text-muted small mb-0">{displayName(user)}</p>
            {storeName ? (
              <p className="text-success small mb-0 text-truncate">{storeName}</p>
            ) : null}
          </div>
          <div className="d-none d-md-block">
            <p className="mb-0 fw-medium">{displayName(user)}</p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <nav className="nav nav-pills d-md-none gap-1">
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
                disabled={!storeId || !shift}
              >
                {t('pos.navShift')}
              </button>
              <button type="button" className="nav-link py-1 px-2 small" onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </nav>
            <LanguageSwitcher className="cashier-topbar__lang" />
          </div>
        </header>

        <main className="flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0">
          <Outlet />
        </main>
      </div>

      <CashierShiftModal open={open} onClose={closeShift} storeId={storeId} shift={shift} />
    </div>
  );
}

export default function CashierLayout() {
  return (
    <CashierShiftModalProvider>
      <CashierLayoutShell />
    </CashierShiftModalProvider>
  );
}

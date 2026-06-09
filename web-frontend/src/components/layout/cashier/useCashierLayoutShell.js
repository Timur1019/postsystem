import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  cashierThemeClassName,
  clearCashierThemeDocument,
  readCashierTheme,
  syncCashierThemeDocument,
  writeCashierTheme,
} from '../../../utils/cashierTheme';
import { syncRootTheme } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { logoutAndResetSession } from '../../../utils/authSession';
import { useCashierStore } from '../../../hooks/useCashierStore';
import { useCashierShiftModal } from '../../../contexts/CashierShiftModalContext';
import { useCashierLock } from '../../../contexts/CashierLockContext';
import { clearCashierScreenLocked } from '../../../utils/cashierLock';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { cashierLoginPath } from '../../../utils/authLogin';
import { useCashierShift } from '../../../hooks/useCashierShift';
import { useOfflineConnectivity } from '../../../hooks/useOfflineConnectivity';
import { useCashierTouchLayout } from '../../../hooks/useCashierTouchLayout';
import { resetCashierDocumentUiState } from '../../../utils/resetCashierDocumentUiState';
import { syncAuthSession } from '../../../utils/syncAuthSession';
import {
  CASHIER_SIDEBAR_KEY,
  displayCashierName,
  formatShiftOpenedAt,
  readSidebarOpen,
} from './cashierLayoutUtils';

export function useCashierLayoutShell() {
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen);
  const [sidebarNavExpanded, setSidebarNavExpanded] = useState(readSidebarOpen);
  const [cashierTheme, setCashierTheme] = useState(readCashierTheme);

  useLayoutEffect(() => {
    syncCashierThemeDocument(cashierTheme);
    return () => {
      clearCashierThemeDocument();
      syncRootTheme();
    };
  }, [cashierTheme]);

  useEffect(() => {
    resetCashierDocumentUiState();
    return () => resetCashierDocumentUiState();
  }, []);

  useEffect(() => {
    syncAuthSession();
  }, []);

  const toggleCashierTheme = () => {
    setCashierTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      writeCashierTheme(next);
      return next;
    });
  };

  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { storeId, storeName, storeLoading, storeError } = useCashierStore();
  const { open, openShift, closeShift } = useCashierShiftModal();
  const { lock } = useCashierLock();
  const navigate = useNavigate();
  const location = useLocation();
  const isPosRoute = location.pathname.startsWith('/cashier/pos');
  const touchLayout = useCashierTouchLayout();

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

  const shiftOpenBadge = useMemo(() => {
    if (shift?.status !== 'OPEN') return null;
    const time = formatShiftOpenedAt(shift.openedAt);
    return time ? t('pos.shiftOpenedAt', { time }) : t('pos.shiftOpen');
  }, [shift, t]);

  const navLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`;

  const handleLogout = () => {
    clearCashierScreenLocked(user?.id);
    logoutAndResetSession();
    navigate(cashierLoginPath());
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
  const themeClass = cashierThemeClassName(cashierTheme);
  const isDesktopApp =
    typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);

  useOfflineConnectivity();

  useEffect(() => {
    if (!isDesktopApp) return undefined;
    document.documentElement.classList.add('cashier-shell--desktop');
    return () => document.documentElement.classList.remove('cashier-shell--desktop');
  }, [isDesktopApp]);

  const shellClassName = `cashier-app ${themeClass} d-flex${sidebarOpen ? '' : ' cashier-app--sidebar-collapsed'}${
    isPosRoute ? ' cashier-app--pos-screen' : ''
  }${touchLayout ? ' cashier-app--touch' : ''}${isDesktopApp ? ' cashier-app--desktop' : ''}`;

  return {
    t,
    user,
    storeId,
    storeName,
    storeLoading,
    storeError,
    open,
    openShift,
    closeShift,
    lock,
    isPosRoute,
    displayAppName,
    shift,
    cashierTheme,
    toggleCashierTheme,
    sidebarOpen,
    sidebarNavExpanded,
    sidebarClass,
    navLinkClass,
    handleLogout,
    toggleSidebar,
    shellClassName,
    isDesktopApp,
    shiftOpenBadge,
    displayCashierName: () => displayCashierName(user),
  };
}

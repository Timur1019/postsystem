import { Outlet } from 'react-router-dom';
import { Menu, PanelLeftClose } from 'lucide-react';
import {
  CashierThemeToggle,
  CashierLockOverlay,
  CashierShiftModal,
  PosTopbarStrip,
  CashierDesktopMenu,
  OfflineStatusBanner,
} from '../../features/cashier';
import { CashierShiftModalProvider } from '../../contexts/CashierShiftModalContext';
import { CashierLockProvider } from '../../contexts/CashierLockContext';
import { PosShellProvider } from '../../contexts/PosShellContext';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import CashierSidebar from './cashier/CashierSidebar';
import CashierMobileNav from './cashier/CashierMobileNav';
import CashierTopbarTerminalMeta from './cashier/CashierTopbarTerminalMeta';
import { useCashierLayoutShell } from './cashier/useCashierLayoutShell';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/cashier/index.css';

function CashierLayoutShell() {
  const p = useCashierLayoutShell();

  return (
    <div className={p.shellClassName}>
      <CashierSidebar
        t={p.t}
        sidebarClass={p.sidebarClass}
        sidebarNavExpanded={p.sidebarNavExpanded}
        displayAppName={p.displayAppName}
        storeId={p.storeId}
        storeName={p.storeName}
        storeLoading={p.storeLoading}
        storeError={p.storeError}
        navLinkClass={p.navLinkClass}
        openShift={p.openShift}
        lock={p.lock}
        toggleSidebar={p.toggleSidebar}
        sidebarOpen={p.sidebarOpen}
        cashierTheme={p.cashierTheme}
        toggleCashierTheme={p.toggleCashierTheme}
        onLogout={p.handleLogout}
      />

      <div className="d-flex flex-column flex-grow-1 min-vw-0 min-h-0">
        {p.isPosRoute ? (
          <PosShellProvider>
            <header className="cashier-topbar cashier-topbar--pos border-bottom">
              <div className="cashier-topbar__row cashier-topbar__row--main">
                <div className="cashier-topbar__brand-block">
                  <button
                    type="button"
                    className="cashier-topbar__menu d-none d-lg-inline-flex"
                    onClick={p.toggleSidebar}
                    aria-label={p.sidebarOpen ? p.t('nav.collapseMenu') : p.t('nav.expandMenu')}
                  >
                    {p.sidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
                  </button>
                  <CashierDesktopMenu appName={p.displayAppName()} />
                  {!p.isDesktopApp ? (
                    <p className="cashier-topbar__terminal-name mb-0 d-none d-md-block">{p.displayAppName()}</p>
                  ) : null}
                  <CashierTopbarTerminalMeta
                    t={p.t}
                    storeName={p.storeName}
                    shiftOpenBadge={p.shiftOpenBadge}
                    shift={p.shift}
                  />
                  <p className="cashier-topbar__pos-title mb-0 fw-semibold d-md-none">{p.t('pos.navSale')}</p>
                </div>
                <PosTopbarStrip />
                <div className="cashier-topbar__actions">
                  <CashierMobileNav
                    t={p.t}
                    openShift={p.openShift}
                    storeId={p.storeId}
                    lock={p.lock}
                    onLogout={p.handleLogout}
                  />
                  <CashierThemeToggle
                    theme={p.cashierTheme}
                    onToggle={p.toggleCashierTheme}
                    compact
                    className="cashier-topbar__theme"
                  />
                  <LanguageSwitcher variant="cashier" className="cashier-topbar__lang" />
                </div>
              </div>
            </header>
            {p.isDesktopApp ? <OfflineStatusBanner /> : null}
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
                  onClick={p.toggleSidebar}
                  aria-label={p.sidebarOpen ? p.t('nav.collapseMenu') : p.t('nav.expandMenu')}
                >
                  {p.sidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
                </button>
                <CashierDesktopMenu appName={p.displayAppName()} />
                <div className="d-lg-none min-w-0">
                  <p className="fw-semibold mb-0">{p.displayAppName()}</p>
                  <p className="text-muted small mb-0">{p.displayCashierName()}</p>
                  {p.storeName ? (
                    <p className="text-success small mb-0 text-truncate">{p.storeName}</p>
                  ) : null}
                </div>
                <div className="d-none d-lg-block min-w-0">
                  {!p.sidebarOpen ? (
                    <p className="cashier-topbar__app-name mb-0 fw-bold">{p.displayAppName()}</p>
                  ) : null}
                  <p className={`mb-0 fw-medium${!p.sidebarOpen ? ' text-muted small' : ''}`}>
                    {p.displayCashierName()}
                  </p>
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <CashierMobileNav
                  t={p.t}
                  openShift={p.openShift}
                  storeId={p.storeId}
                  lock={p.lock}
                  onLogout={p.handleLogout}
                />
                <CashierThemeToggle
                  theme={p.cashierTheme}
                  onToggle={p.toggleCashierTheme}
                  compact
                  className="cashier-topbar__theme"
                />
                <LanguageSwitcher variant="cashier" className="cashier-topbar__lang" />
              </div>
            </header>
            {p.isDesktopApp ? <OfflineStatusBanner /> : null}
            <main className="flex-grow-1 overflow-hidden p-2 p-lg-3 d-flex flex-column min-h-0">
              <Outlet />
            </main>
          </>
        )}
      </div>

      <CashierShiftModal
        open={p.open}
        onClose={p.closeShift}
        storeId={p.storeId}
        storeName={p.storeName}
        cashierName={p.displayCashierName()}
        shift={p.shift}
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

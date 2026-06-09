import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { logoutAndResetSession } from '../../utils/authSession';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import AppSidebar from './AppSidebar';
import AppTopHeader from './AppTopHeader';
import {
  GOODS_ROUTES,
  STOCK_ROUTES,
  ORDER_ROUTES,
  REGISTER_ROUTES,
  USER_ROUTES,
  REPORT_ROUTES,
  REPORT_SALES_ROUTES,
  REPORT_STOCK_ROUTES,
  GOODS_CHILDREN,
  STOCK_CHILDREN,
  ORDER_CHILDREN,
  REGISTER_CHILDREN,
  USER_CHILDREN,
  REPORT_SALES_CHILDREN,
  REPORT_STOCK_CHILDREN,
  REST_NAV,
} from './layoutNavConfig';
import { syncAuthSession } from '../../utils/syncAuthSession';
import '../../styles/cashier/modals/index.css';

export default function AppShellLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  const [sidebarNavExpanded, setSidebarNavExpanded] = useState(true);
  const [goodsOpen, setGoodsOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [reportsSalesOpen, setReportsSalesOpen] = useState(true);
  const [reportsStockOpen, setReportsStockOpen] = useState(true);

  useEffect(() => {
    syncAuthSession();
  }, []);
  const [registersOpen, setRegistersOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);

  const filterByModule = (items) => items.filter((item) => !item.moduleId || hasModule(item.moduleId));
  const goodsNav = filterByModule(GOODS_CHILDREN);
  const stockNav = filterByModule(STOCK_CHILDREN);
  const ordersNav = filterByModule(ORDER_CHILDREN);
  const registersNav = filterByModule(REGISTER_CHILDREN);
  const reportsSalesNav = filterByModule(REPORT_SALES_CHILDREN);
  const reportsStockNav = filterByModule(REPORT_STOCK_CHILDREN);
  const usersNav = filterByModule(USER_CHILDREN);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const syncViewport = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (desktop) setMobileNavOpen(false);
      else {
        setSidebarOpen(false);
        setSidebarNavExpanded(true);
      }
    };
    syncViewport();
    mq.addEventListener('change', syncViewport);
    return () => mq.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => setMobileNavOpen(false), [location.pathname]);
  useEffect(() => {
    if (GOODS_ROUTES.includes(location.pathname)) setGoodsOpen(true);
    if (STOCK_ROUTES.includes(location.pathname)) setStockOpen(true);
    if (REPORT_ROUTES.includes(location.pathname)) setReportsOpen(true);
    if (REPORT_SALES_ROUTES.includes(location.pathname)) setReportsSalesOpen(true);
    if (REPORT_STOCK_ROUTES.includes(location.pathname)) setReportsStockOpen(true);
    if (location.pathname === '/reports') {
      setReportsOpen(true);
      setReportsSalesOpen(true);
      setReportsStockOpen(true);
    }
    if (REGISTER_ROUTES.includes(location.pathname)) setRegistersOpen(true);
    if (USER_ROUTES.includes(location.pathname)) setUsersOpen(true);
    if (ORDER_ROUTES.includes(location.pathname)) setOrdersOpen(true);
  }, [location.pathname]);

  const handleLogout = () => {
    logoutAndResetSession();
    navigate('/login');
  };
  const navLabelsVisible = isDesktop ? sidebarNavExpanded : true;
  const toggleSidebar = () => {
    if (!isDesktop) return setMobileNavOpen((open) => !open);
    if (sidebarOpen) {
      setSidebarNavExpanded(false);
      return setSidebarOpen(false);
    }
    setSidebarOpen(true);
  };
  const onSidebarTransitionEnd = (e) => {
    if (e.propertyName === 'width') setSidebarNavExpanded(sidebarOpen);
  };
  const topLinkClass = ({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300'
      : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
  }`;
  const subLinkClass = ({ isActive }) => `ml-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'border-emerald-500 bg-white text-emerald-900 shadow-sm dark:border-sky-500 dark:bg-slate-950 dark:text-white dark:shadow-[0_0_0_1px_rgba(56,189,248,0.15)]'
      : 'border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
  }`;

  const visibleRest = REST_NAV.filter((item) => (!item.roles || item.roles.includes(user?.role)) && (!item.moduleId || hasModule(item.moduleId)));
  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : '';

  return (
    <div className="admin-shell flex overflow-hidden bg-slate-100 text-slate-900 print:!bg-white print:!text-black print:min-h-0 dark:bg-slate-950 dark:text-slate-100">
      <AppSidebar
        t={t}
        user={user}
        displayAppName={displayAppName}
        mobileNavOpen={mobileNavOpen}
        isDesktop={isDesktop}
        sidebarOpen={sidebarOpen}
        navLabelsVisible={navLabelsVisible}
        onSidebarTransitionEnd={onSidebarTransitionEnd}
        onCloseMobile={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
        topLinkClass={topLinkClass}
        subLinkClass={subLinkClass}
        showDashboard={hasModule('dashboard')}
        showAssistant={hasModule('aiAssistant')}
        inAssistantSection={location.pathname.startsWith('/assistant')}
        showGoods={goodsNav.length > 0}
        showStock={stockNav.length > 0}
        showOrders={ordersNav.length > 0}
        showRegisters={registersNav.length > 0}
        showReports={reportsSalesNav.length > 0 || reportsStockNav.length > 0}
        showUsers={usersNav.length > 0}
        inGoodsSection={GOODS_ROUTES.includes(location.pathname)}
        inStockSection={STOCK_ROUTES.includes(location.pathname)}
        inOrdersSection={ORDER_ROUTES.includes(location.pathname)}
        inRegistersSection={REGISTER_ROUTES.includes(location.pathname)}
        inReportsSection={REPORT_ROUTES.includes(location.pathname)}
        inReportsSalesSection={REPORT_SALES_ROUTES.includes(location.pathname)}
        inReportsStockSection={REPORT_STOCK_ROUTES.includes(location.pathname)}
        inUsersSection={USER_ROUTES.includes(location.pathname)}
        goodsOpen={goodsOpen}
        stockOpen={stockOpen}
        ordersOpen={ordersOpen}
        registersOpen={registersOpen}
        reportsOpen={reportsOpen}
        reportsSalesOpen={reportsSalesOpen}
        reportsStockOpen={reportsStockOpen}
        usersOpen={usersOpen}
        setGoodsOpen={setGoodsOpen}
        setStockOpen={setStockOpen}
        setOrdersOpen={setOrdersOpen}
        setRegistersOpen={setRegistersOpen}
        setReportsOpen={setReportsOpen}
        setReportsSalesOpen={setReportsSalesOpen}
        setReportsStockOpen={setReportsStockOpen}
        setUsersOpen={setUsersOpen}
        goodsNav={goodsNav}
        stockNav={stockNav}
        ordersNav={ordersNav}
        registersNav={registersNav}
        showReportsSales={reportsSalesNav.length > 0}
        showReportsStock={reportsStockNav.length > 0}
        reportsSalesNav={reportsSalesNav}
        reportsStockNav={reportsStockNav}
        reportsHubActive={location.pathname === '/reports'}
        usersNav={usersNav}
        visibleRest={visibleRest}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopHeader
          t={t}
          user={user}
          roleLabel={roleLabel}
          displayAppName={displayAppName}
          isDesktop={isDesktop}
          sidebarOpen={sidebarOpen}
          mobileNavOpen={mobileNavOpen}
          onToggleSidebar={toggleSidebar}
        />
        <main className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 p-3 sm:p-4 md:p-6 print:!bg-white print:p-4 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


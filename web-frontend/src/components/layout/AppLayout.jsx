// src/components/layout/AppLayout.jsx
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart2,
  Users,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  ChevronDown,
  Package,
  Tags,
  Receipt,
  RotateCcw,
  Home,
  Building2,
  Calculator,
  List,
  FileText,
  ArrowRightLeft,
  SlidersHorizontal,
  Printer,
  UserCog,
  Truck,
  ClipboardList,
  Store,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import BrandMark from '../shared/BrandMark';
import { useModuleAccess } from '../../hooks/useModuleAccess';

const GOODS_ROUTES = ['/products', '/categories'];

const GOODS_CHILDREN = [
  { to: '/products', key: 'productsList', icon: Package, moduleId: 'products' },
  { to: '/categories', key: 'categories', icon: Tags, moduleId: 'categories' },
];

const STOCK_ROUTES = ['/stock/products', '/stock/suppliers'];

const STOCK_CHILDREN = [
  { to: '/stock/products', key: 'stockProducts', icon: Package, moduleId: 'stockProducts' },
  { to: '/stock/suppliers', key: 'stockSuppliers', icon: Building2, moduleId: 'stockSuppliers' },
];

const ORDER_ROUTES = ['/orders/list'];

const ORDER_CHILDREN = [
  { to: '/orders/list', key: 'ordersList', icon: ClipboardList, moduleId: 'ordersList' },
];

const REPORT_ROUTES = ['/reports/sales', '/reports/returns', '/reports/analytics'];

const REGISTER_ROUTES = ['/cash-registers/list', '/cash-registers/z-reports', '/cash-registers/transfer', '/cash-registers/config'];

const REGISTER_CHILDREN = [
  { to: '/cash-registers/list', key: 'registersList', icon: List, moduleId: 'registersList' },
  { to: '/cash-registers/z-reports', key: 'registersZReports', icon: FileText, moduleId: 'registersZReports' },
  { to: '/cash-registers/transfer', key: 'registersTransfer', icon: ArrowRightLeft, moduleId: 'registersTransfer' },
  { to: '/cash-registers/config', key: 'registersConfig', icon: SlidersHorizontal, moduleId: 'registersConfig' },
];

const USER_ROUTES = ['/users/list', '/users/printer-settings', '/users/branding-settings'];

const USER_CHILDREN = [
  { to: '/users/list', key: 'usersList', icon: List, moduleId: 'usersList' },
  { to: '/users/printer-settings', key: 'usersPrinterSettings', icon: Printer, moduleId: 'usersPrinterSettings' },
  { to: '/users/branding-settings', key: 'usersBrandingSettings', icon: UserCog, moduleId: 'usersBrandingSettings' },
];

const REPORT_CHILDREN = [
  { to: '/reports/sales', key: 'reportsSales', icon: Receipt, moduleId: 'reportsSales' },
  { to: '/reports/returns', key: 'reportsReturns', icon: RotateCcw, moduleId: 'reportsReturns' },
  { to: '/reports/analytics', key: 'reportsAnalytics', icon: BarChart2, moduleId: 'reportsAnalytics' },
];

const REST_NAV = [{ to: '/stores', icon: Store, key: 'stores', roles: ['ADMIN'], moduleId: 'stores' }];

export default function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  /** Полное меню — после анимации ширины, чтобы не тормозить открытие */
  const [sidebarNavExpanded, setSidebarNavExpanded] = useState(true);
  const [goodsOpen, setGoodsOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [registersOpen, setRegistersOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const { hasModule, hasAnyModule } = useModuleAccess();
  const navigate = useNavigate();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  const filterByModule = (items) => items.filter((item) => !item.moduleId || hasModule(item.moduleId));
  const goodsNav = filterByModule(GOODS_CHILDREN);
  const stockNav = filterByModule(STOCK_CHILDREN);
  const ordersNav = filterByModule(ORDER_CHILDREN);
  const registersNav = filterByModule(REGISTER_CHILDREN);
  const reportsNav = filterByModule(REPORT_CHILDREN);
  const usersNav = filterByModule(USER_CHILDREN);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const syncViewport = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (desktop) {
        setMobileNavOpen(false);
      } else {
        setSidebarOpen(false);
        setSidebarNavExpanded(true);
      }
    };
    syncViewport();
    mq.addEventListener('change', syncViewport);
    return () => mq.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (GOODS_ROUTES.includes(location.pathname)) setGoodsOpen(true);
    if (STOCK_ROUTES.includes(location.pathname)) setStockOpen(true);
    if (REPORT_ROUTES.includes(location.pathname)) setReportsOpen(true);
    if (REGISTER_ROUTES.includes(location.pathname)) setRegistersOpen(true);
    if (USER_ROUTES.includes(location.pathname)) setUsersOpen(true);
    if (ORDER_ROUTES.includes(location.pathname)) setOrdersOpen(true);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLabelsVisible = isDesktop ? sidebarNavExpanded : true;

  const toggleSidebar = () => {
    if (!isDesktop) {
      setMobileNavOpen((open) => !open);
      setSidebarNavExpanded(true);
      return;
    }
    if (sidebarOpen) {
      setSidebarNavExpanded(false);
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(true);
  };

  const onSidebarTransitionEnd = (e) => {
    if (e.propertyName !== 'width') return;
    setSidebarNavExpanded(sidebarOpen);
  };

  const visibleRest = REST_NAV.filter(
    (item) => (!item.roles || item.roles.includes(user?.role)) && (!item.moduleId || hasModule(item.moduleId))
  );
  const showGoods = goodsNav.length > 0;
  const showStock = stockNav.length > 0;
  const showRegisters = registersNav.length > 0;
  const showOrders = ordersNav.length > 0;
  const showReports = reportsNav.length > 0;
  const showUsers = usersNav.length > 0;
  const showDashboard = hasModule('dashboard');
  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : '';
  const inGoodsSection = GOODS_ROUTES.includes(location.pathname);
  const inStockSection = STOCK_ROUTES.includes(location.pathname);
  const inReportsSection = REPORT_ROUTES.includes(location.pathname);
  const inRegistersSection = REGISTER_ROUTES.includes(location.pathname);
  const inUsersSection = USER_ROUTES.includes(location.pathname);
  const inOrdersSection = ORDER_ROUTES.includes(location.pathname);
  const inHandbookSection = location.pathname.startsWith('/handbook');

  const subLinkClass = ({ isActive }) =>
    `ml-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'border-emerald-500 bg-white text-emerald-900 shadow-sm dark:border-sky-500 dark:bg-slate-950 dark:text-white dark:shadow-[0_0_0_1px_rgba(56,189,248,0.15)]'
        : 'border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
    }`;

  const topLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300'
        : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
    }`;

  return (
    <div className="admin-shell flex overflow-hidden bg-slate-100 text-slate-900 print:!bg-white print:!text-black print:min-h-0 dark:bg-slate-950 dark:text-slate-100">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 print:hidden lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        onTransitionEnd={onSidebarTransitionEnd}
        className={`print:hidden fixed inset-y-0 left-0 z-40 flex max-w-[min(100vw,20rem)] flex-col overflow-hidden border-r border-slate-200 bg-slate-50 shadow-xl transition-[transform,width] duration-200 ease-out dark:border-emerald-900/70 dark:bg-emerald-950 lg:static lg:z-auto lg:max-w-none lg:shadow-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'w-[min(100vw,20rem)] lg:w-60' : 'w-[min(100vw,20rem)] lg:w-16'}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-emerald-900/60">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500">
            <BrandMark size={16} iconClassName="text-white" />
          </div>
          {navLabelsVisible && (
            <span className="truncate text-lg font-bold text-slate-900 dark:text-white">{displayAppName()}</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {showDashboard ? (
            <NavLink to="/dashboard" end className={topLinkClass}>
              <LayoutDashboard size={18} className="flex-shrink-0" />
              {navLabelsVisible && t('nav.dashboard')}
            </NavLink>
          ) : null}

          <NavLink
            to="/handbook/dashboard"
            className={({ isActive }) =>
              topLinkClass({ isActive: isActive || inHandbookSection })
            }
          >
            <BookOpen size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.handbook')}
          </NavLink>

          <NavLink to="/support" className={topLinkClass}>
            <Headphones size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.support')}
          </NavLink>

          {showGoods && navLabelsVisible ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setGoodsOpen((o) => !o)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  inGoodsSection
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
                    : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <LayoutGrid size={18} className="flex-shrink-0 opacity-90" />
                  <span className="truncate">{t('nav.goodsGroup')}</span>
                </span>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${goodsOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {goodsOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
                  {goodsNav.map(({ to, key, icon: Icon }) => (
                    <NavLink key={to} to={to} className={subLinkClass}>
                      <Icon size={16} className="flex-shrink-0 opacity-80" />
                      {t(`nav.${key}`)}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : showGoods ? (
            <div className="space-y-1 pt-1">
              {goodsNav.map(({ to, key, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={t(`nav.${key}`)}
                  className={({ isActive }) =>
                    `flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                      isActive
                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-emerald-900/40'
                    }`
                  }
                >
                  <Icon size={18} />
                </NavLink>
              ))}
            </div>
          ) : null}

          {showStock && navLabelsVisible ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setStockOpen((o) => !o)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  inStockSection
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
                    : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Home size={18} className="flex-shrink-0 opacity-90" />
                  <span className="truncate">{t('nav.stockGroup')}</span>
                </span>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${stockOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {stockOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
                  {stockNav.map(({ to, key, icon: Icon }) => (
                    <NavLink key={to} to={to} className={subLinkClass}>
                      <Icon size={16} className="flex-shrink-0 opacity-80" />
                      {t(`nav.${key}`)}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : showStock ? (
            <div className="space-y-1 pt-1">
              {stockNav.map(({ to, key, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={t(`nav.${key}`)}
                  className={({ isActive }) =>
                    `flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                      isActive
                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-emerald-900/40'
                    }`
                  }
                >
                  <Icon size={18} />
                </NavLink>
              ))}
            </div>
          ) : null}

          {showOrders &&
            (navLabelsVisible ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setOrdersOpen((o) => !o)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    inOrdersSection
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Truck size={18} className="flex-shrink-0 opacity-90" />
                    <span className="truncate">{t('nav.ordersGroup')}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${ordersOpen ? '' : '-rotate-90'}`}
                  />
                </button>
                {ordersOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
                    {ordersNav.map(({ to, key, icon: Icon }) => (
                      <NavLink key={to} to={to} className={subLinkClass}>
                        <Icon size={16} className="flex-shrink-0 opacity-80" />
                        {t(`nav.${key}`)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {ordersNav.map(({ to, key, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={t(`nav.${key}`)}
                    className={({ isActive }) =>
                      `flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                        isActive
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-emerald-900/40'
                      }`
                    }
                  >
                    <Icon size={18} />
                  </NavLink>
                ))}
              </div>
            ))}

          {showRegisters &&
            (navLabelsVisible ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setRegistersOpen((o) => !o)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    inRegistersSection
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Calculator size={18} className="flex-shrink-0 opacity-90" />
                    <span className="truncate">{t('nav.registersGroup')}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${registersOpen ? '' : '-rotate-90'}`}
                  />
                </button>
                {registersOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
                    {registersNav.map(({ to, key, icon: Icon }) => (
                      <NavLink key={to} to={to} className={subLinkClass}>
                        <Icon size={16} className="flex-shrink-0 opacity-80" />
                        {t(`nav.${key}`)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {registersNav.map(({ to, key, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={t(`nav.${key}`)}
                    className={({ isActive }) =>
                      `flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                        isActive
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-emerald-900/40'
                      }`
                    }
                  >
                    <Icon size={18} />
                  </NavLink>
                ))}
              </div>
            ))}

          {showReports &&
            (navLabelsVisible ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setReportsOpen((o) => !o)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    inReportsSection
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <BarChart2 size={18} className="flex-shrink-0 opacity-90" />
                    <span className="truncate">{t('nav.reportsGroup')}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${reportsOpen ? '' : '-rotate-90'}`}
                  />
                </button>
                {reportsOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
                    {reportsNav.map(({ to, key, icon: Icon }) => (
                      <NavLink key={to} to={to} className={subLinkClass}>
                        <Icon size={16} className="flex-shrink-0 opacity-80" />
                        {t(`nav.${key}`)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {reportsNav.map(({ to, key, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={t(`nav.${key}`)}
                    className={({ isActive }) =>
                      `flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                        isActive
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-emerald-900/40'
                      }`
                    }
                  >
                    <Icon size={18} />
                  </NavLink>
                ))}
              </div>
            ))}

          {showUsers &&
            (navLabelsVisible ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setUsersOpen((o) => !o)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    inUsersSection
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Users size={18} className="flex-shrink-0 opacity-90" />
                    <span className="truncate">{t('nav.usersGroup')}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${usersOpen ? '' : '-rotate-90'}`}
                  />
                </button>
                {usersOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
                    {usersNav.map(({ to, key, icon: Icon }) => (
                      <NavLink key={to} to={to} className={subLinkClass}>
                        <Icon size={16} className="flex-shrink-0 opacity-80" />
                        {t(`nav.${key}`)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {usersNav.map(({ to, key, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={t(`nav.${key}`)}
                    className={({ isActive }) =>
                      `flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                        isActive
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-emerald-900/40'
                      }`
                    }
                  >
                    <Icon size={18} />
                  </NavLink>
                ))}
              </div>
            ))}

          {visibleRest.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={topLinkClass}>
              <Icon size={18} className="flex-shrink-0" />
              {navLabelsVisible && t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-2 dark:border-emerald-900/60">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="print:hidden flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:h-16 sm:px-4 md:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={mobileNavOpen || sidebarOpen ? t('nav.closeMenu') : t('nav.expandMenu')}
            >
              {isDesktop ? (sidebarOpen ? <X size={20} /> : <Menu size={20} />) : <Menu size={20} />}
            </button>
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{displayAppName()}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.fullName}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 font-bold text-white">
                {user?.fullName?.[0] ?? 'U'}
              </div>
              <div className="hidden md:block">
                <div className="font-medium text-slate-900 dark:text-white">{user?.fullName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 p-3 sm:p-4 md:p-6 print:!bg-white print:p-4 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

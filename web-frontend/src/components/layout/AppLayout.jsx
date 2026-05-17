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
  Bell,
  LayoutGrid,
  ChevronDown,
  Package,
  Tags,
  Receipt,
  RotateCcw,
  Home,
  Building2,
  Printer,
  Calculator,
  List,
  FileText,
  ArrowRightLeft,
  SlidersHorizontal,
  Truck,
  ClipboardList,
  Store,
  BookOpen,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import ThemeToggle from '../shared/ThemeToggle';
import { APP_NAME } from '../../config/brand';
import { POS_RECEIPT_PRINT_EVENT } from '../../utils/printWithHtmlClass';

const GOODS_ROUTES = ['/products', '/categories'];

const GOODS_CHILDREN = [
  { to: '/products', key: 'productsList', icon: Package },
  { to: '/categories', key: 'categories', icon: Tags },
];

const STOCK_ROUTES = ['/stock/products', '/stock/suppliers'];

const STOCK_CHILDREN = [
  { to: '/stock/products', key: 'stockProducts', icon: Package },
  { to: '/stock/suppliers', key: 'stockSuppliers', icon: Building2 },
];

const ORDER_ROUTES = ['/orders/list'];

const ORDER_CHILDREN = [
  { to: '/orders/list', key: 'ordersList', icon: ClipboardList },
];

const REPORT_ROUTES = ['/reports/sales', '/reports/returns', '/reports/analytics'];

const REGISTER_ROUTES = ['/cash-registers/list', '/cash-registers/z-reports', '/cash-registers/transfer', '/cash-registers/config'];

const REGISTER_CHILDREN = [
  { to: '/cash-registers/list', key: 'registersList', icon: List },
  { to: '/cash-registers/z-reports', key: 'registersZReports', icon: FileText },
  { to: '/cash-registers/transfer', key: 'registersTransfer', icon: ArrowRightLeft },
  { to: '/cash-registers/config', key: 'registersConfig', icon: SlidersHorizontal },
];

const REPORT_CHILDREN = [
  { to: '/reports/sales', key: 'reportsSales', icon: Receipt },
  { to: '/reports/returns', key: 'reportsReturns', icon: RotateCcw },
  { to: '/reports/analytics', key: 'reportsAnalytics', icon: BarChart2 },
];

const REST_NAV = [
  { to: '/stores', icon: Store, key: 'stores', roles: ['ADMIN'] },
  { to: '/users', icon: Users, key: 'users', roles: ['ADMIN'] },
];

export default function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [goodsOpen, setGoodsOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [registersOpen, setRegistersOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (GOODS_ROUTES.includes(location.pathname)) setGoodsOpen(true);
    if (STOCK_ROUTES.includes(location.pathname)) setStockOpen(true);
    if (REPORT_ROUTES.includes(location.pathname)) setReportsOpen(true);
    if (REGISTER_ROUTES.includes(location.pathname)) setRegistersOpen(true);
    if (ORDER_ROUTES.includes(location.pathname)) setOrdersOpen(true);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleRest = REST_NAV.filter((item) => !item.roles || item.roles.includes(user?.role));
  const showRegisters = ['ADMIN', 'MANAGER'].includes(user?.role);
  const showOrders = ['ADMIN', 'MANAGER'].includes(user?.role);
  const showReports = ['ADMIN', 'MANAGER'].includes(user?.role);
  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : '';
  const inGoodsSection = GOODS_ROUTES.includes(location.pathname);
  const inStockSection = STOCK_ROUTES.includes(location.pathname);
  const inReportsSection = REPORT_ROUTES.includes(location.pathname);
  const inRegistersSection = REGISTER_ROUTES.includes(location.pathname);
  const inOrdersSection = ORDER_ROUTES.includes(location.pathname);
  const inHandbookSection = location.pathname.startsWith('/handbook');
  const isReceiptRoute = /^\/receipt\//.test(location.pathname);

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
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 print:!bg-white print:!text-black print:min-h-0 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`print:hidden flex flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300 dark:border-emerald-900/70 dark:bg-emerald-950 ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-emerald-900/60">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500">
            <ShoppingCart size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold text-slate-900 dark:text-white">{APP_NAME}</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          <NavLink to="/dashboard" end className={topLinkClass}>
            <LayoutDashboard size={18} className="flex-shrink-0" />
            {sidebarOpen && t('nav.dashboard')}
          </NavLink>

          <NavLink
            to="/handbook/dashboard"
            className={({ isActive }) =>
              topLinkClass({ isActive: isActive || inHandbookSection })
            }
          >
            <BookOpen size={18} className="flex-shrink-0" />
            {sidebarOpen && t('nav.handbook')}
          </NavLink>

          {sidebarOpen ? (
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
                  {GOODS_CHILDREN.map(({ to, key, icon: Icon }) => (
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
              {GOODS_CHILDREN.map(({ to, key, icon: Icon }) => (
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
          )}

          {sidebarOpen ? (
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
                  {STOCK_CHILDREN.map(({ to, key, icon: Icon }) => (
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
              {STOCK_CHILDREN.map(({ to, key, icon: Icon }) => (
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
          )}

          {showOrders &&
            (sidebarOpen ? (
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
                    {ORDER_CHILDREN.map(({ to, key, icon: Icon }) => (
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
                {ORDER_CHILDREN.map(({ to, key, icon: Icon }) => (
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
            (sidebarOpen ? (
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
                    {REGISTER_CHILDREN.map(({ to, key, icon: Icon }) => (
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
                {REGISTER_CHILDREN.map(({ to, key, icon: Icon }) => (
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
            (sidebarOpen ? (
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
                    {REPORT_CHILDREN.map(({ to, key, icon: Icon }) => (
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
                {REPORT_CHILDREN.map(({ to, key, icon: Icon }) => (
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
              {sidebarOpen && t(`nav.${key}`)}
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
            {sidebarOpen && t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="print:hidden flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3 md:gap-4">
            {isReceiptRoute && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent(POS_RECEIPT_PRINT_EVENT))}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">{t('receipt.print')}</span>
              </button>
            )}
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              type="button"
              className="relative text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <Bell size={20} />
            </button>
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

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6 print:!bg-white print:p-4 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

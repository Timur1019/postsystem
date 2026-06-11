import {
  LayoutDashboard,
  LayoutGrid,
  Package,
  Tags,
  Home,
  Plus,
  ClipboardList,
  ArrowRightLeft,
  Building2,
  Truck,
  BarChart2,
  Calculator,
  Store,
  UserCog,
  Receipt,
  RotateCcw,
  Warehouse,
  AlertTriangle,
  ArrowLeftRight,
  History,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  List,
  FileText,
  Printer,
  Barcode,
  Users,
  Headphones,
  BookOpen,
  Bot,
  LogOut,
} from 'lucide-react';

export const ICONS = {
  LayoutDashboard,
  LayoutGrid,
  Package,
  Tags,
  Home,
  Plus,
  ClipboardList,
  ArrowRightLeft,
  Building2,
  Truck,
  BarChart2,
  Calculator,
  Store,
  UserCog,
  Receipt,
  RotateCcw,
  Warehouse,
  AlertTriangle,
  ArrowLeftRight,
  History,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  List,
  FileText,
  Printer,
  Barcode,
  Users,
  Headphones,
  BookOpen,
  Bot,
  LogOut,
};

export const GOODS_ROUTES = ['/products', '/categories'];
export const STOCK_ROUTES = ['/stock/products', '/stock/receipts/new', '/stock/inventories/new', '/stock/transfers/new', '/stock/suppliers'];
export const ORDER_ROUTES = ['/orders/list'];
export const FINANCE_ROUTES = ['/finance/dashboard', '/finance/incomes', '/finance/expenses', '/finance/accounts', '/finance/reports', '/finance/categories'];
export const REGISTER_ROUTES = ['/cash-registers/list', '/cash-registers/z-reports', '/cash-registers/transfer', '/cash-registers/config'];
export const USER_ROUTES = ['/users/list', '/users/printer-settings', '/users/branding-settings', '/users/barcode-print'];

export const GOODS_CHILDREN = [
  { to: '/products', key: 'productsList', icon: ICONS.Package, moduleId: 'products' },
  { to: '/categories', key: 'categories', icon: ICONS.Tags, moduleId: 'categories' },
];

export const STOCK_CHILDREN = [
  { to: '/stock/products', key: 'stockProducts', icon: ICONS.Package, moduleId: 'stockProducts' },
  { to: '/stock/receipts/new', key: 'stockReceipts', icon: ICONS.Plus, moduleId: 'stockReceipts' },
  { to: '/stock/inventories/new', key: 'stockInventories', icon: ICONS.ClipboardList, moduleId: 'stockInventories' },
  { to: '/stock/transfers/new', key: 'stockTransfers', icon: ICONS.ArrowRightLeft, moduleId: 'stockTransfers' },
  { to: '/stock/suppliers', key: 'stockSuppliers', icon: ICONS.Building2, moduleId: 'stockSuppliers' },
];

export const ORDER_CHILDREN = [{ to: '/orders/list', key: 'ordersList', icon: ICONS.ClipboardList, moduleId: 'ordersList' }];

export const REPORT_HUB = { to: '/reports', key: 'reportsHub', icon: ICONS.BarChart2 };

export const REPORT_SALES_CHILDREN = [
  { to: '/reports/analytics', key: 'reportsAnalytics', icon: ICONS.BarChart2, moduleId: 'reportsAnalytics' },
  { to: '/reports/sales/daily', key: 'reportsSalesDaily', icon: ICONS.Calculator, moduleId: 'reportsSalesDaily' },
  { to: '/reports/sales/period-compare', key: 'reportsSalesPeriodCompare', icon: ICONS.ArrowLeftRight, moduleId: 'reportsSalesPeriodCompare' },
  { to: '/reports/sales/by-stores', key: 'reportsSalesByStores', icon: ICONS.Store, moduleId: 'reportsSalesByStores' },
  { to: '/reports/sales/by-categories', key: 'reportsSalesByCategories', icon: ICONS.Tags, moduleId: 'reportsSalesByCategories' },
  { to: '/reports/sales/by-products', key: 'reportsSalesByProducts', icon: ICONS.Package, moduleId: 'reportsSalesByProducts' },
  { to: '/reports/sales', key: 'reportsSales', icon: ICONS.Receipt, moduleId: 'reportsSales' },
  { to: '/reports/sales/cashiers', key: 'reportsCashierPerformance', icon: ICONS.UserCog, moduleId: 'reportsCashierPerformance' },
  { to: '/reports/returns', key: 'reportsReturns', icon: ICONS.RotateCcw, moduleId: 'reportsReturns' },
];

export const REPORT_STOCK_CHILDREN = [
  { to: '/reports/stock', key: 'reportsStockDashboard', icon: ICONS.Warehouse, moduleId: 'reportsStockDashboard' },
  { to: '/reports/stock/balances', key: 'reportsStockBalances', icon: ICONS.Package, moduleId: 'reportsStockBalances' },
  { to: '/reports/stock/low', key: 'reportsStockLow', icon: ICONS.AlertTriangle, moduleId: 'reportsStockLow' },
  { to: '/reports/stock/dead', key: 'reportsStockDead', icon: ICONS.AlertTriangle, moduleId: 'reportsStockDead' },
  { to: '/reports/stock/turnover', key: 'reportsStockTurnover', icon: ICONS.ArrowLeftRight, moduleId: 'reportsStockTurnover' },
  { to: '/reports/stock/lifecycle', key: 'reportsStockLifecycle', icon: ICONS.History, moduleId: 'reportsStockLifecycle' },
  { to: '/reports/stock/movements', key: 'reportsStockMovements', icon: ICONS.ClipboardList, moduleId: 'reportsStockMovements' },
  { to: '/reports/stock/adjustments', key: 'reportsStockAdjustments', icon: ICONS.SlidersHorizontal, moduleId: 'reportsStockAdjustments' },
  { to: '/reports/stock/receipts', key: 'reportsStockReceipts', icon: ICONS.TrendingUp, moduleId: 'reportsStockReceipts' },
  { to: '/reports/stock/write-offs', key: 'reportsStockWriteOffs', icon: ICONS.TrendingDown, moduleId: 'reportsStockWriteOffs' },
  { to: '/reports/stock/inventories', key: 'reportsStockInventories', icon: ICONS.ClipboardList, moduleId: 'reportsStockInventories' },
  { to: '/reports/stock/transfers', key: 'reportsStockTransfers', icon: ICONS.Truck, moduleId: 'reportsStockTransfers' },
];

export const FINANCE_CHILDREN = [
  { to: '/finance/dashboard', key: 'financeDashboard', icon: ICONS.LayoutDashboard, moduleId: 'financeDashboard' },
  { to: '/finance/incomes', key: 'financeIncomes', icon: ICONS.TrendingUp, moduleId: 'financeIncomes' },
  { to: '/finance/debts', key: 'financeDebts', icon: ICONS.Users, moduleId: 'financeDebts' },
  { to: '/finance/expenses', key: 'financeExpenses', icon: ICONS.TrendingDown, moduleId: 'financeExpenses' },
  { to: '/finance/accounts', key: 'financeAccounts', icon: ICONS.Building2, moduleId: 'financeAccounts' },
  { to: '/finance/transfers', key: 'financeTransfers', icon: ICONS.ArrowRightLeft, moduleId: 'financeTransfers' },
  { to: '/finance/reports', key: 'financeReports', icon: ICONS.BarChart2, moduleId: 'financeReports' },
  { to: '/finance/audit', key: 'financeAudit', icon: ICONS.FileText, moduleId: 'financeAudit' },
  { to: '/finance/categories', key: 'financeCategories', icon: ICONS.Tags, moduleId: 'financeCategories' },
  { to: '/finance/sync', key: 'financeSync', icon: ICONS.RotateCcw, moduleId: 'financeSync' },
];

export const REGISTER_CHILDREN = [
  { to: '/cash-registers/list', key: 'registersList', icon: ICONS.List, moduleId: 'registersList' },
  { to: '/cash-registers/z-reports', key: 'registersZReports', icon: ICONS.FileText, moduleId: 'registersZReports' },
  { to: '/cash-registers/transfer', key: 'registersTransfer', icon: ICONS.ArrowRightLeft, moduleId: 'registersTransfer' },
  { to: '/cash-registers/config', key: 'registersConfig', icon: ICONS.SlidersHorizontal, moduleId: 'registersConfig' },
];

export const USER_CHILDREN = [
  { to: '/users/list', key: 'usersList', icon: ICONS.List, moduleId: 'usersList' },
  { to: '/users/printer-settings', key: 'usersPrinterSettings', icon: ICONS.Printer, moduleId: 'usersPrinterSettings' },
  { to: '/users/branding-settings', key: 'usersBrandingSettings', icon: ICONS.UserCog, moduleId: 'usersBrandingSettings' },
  { to: '/users/barcode-print', key: 'usersBarcodePrint', icon: ICONS.Barcode, moduleId: 'usersBarcodePrint' },
];

export const REST_NAV = [{ to: '/stores', icon: ICONS.Store, key: 'stores', roles: ['ADMIN'], moduleId: 'stores' }];

export const REPORT_SALES_ROUTES = REPORT_SALES_CHILDREN.map((item) => item.to);
export const REPORT_STOCK_ROUTES = REPORT_STOCK_CHILDREN.map((item) => item.to);
export const REPORT_ROUTES = ['/reports', ...REPORT_SALES_ROUTES, ...REPORT_STOCK_ROUTES];


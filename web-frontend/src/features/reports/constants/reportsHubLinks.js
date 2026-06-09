import {
  BarChart2,
  Receipt,
  Warehouse,
  Calculator,
  ArrowLeftRight,
  Store,
  Tags,
  Package,
  UserCog,
  RotateCcw,
  AlertTriangle,
  TrendingDown,
  ClipboardList,
  Truck,
  History,
} from 'lucide-react';

export const REPORTS_HUB_SALES_LINKS = [
  { to: '/reports/analytics', key: 'reportsAnalytics', icon: BarChart2, moduleId: 'reportsAnalytics' },
  { to: '/reports/sales/daily', key: 'reportsSalesDaily', icon: Calculator, moduleId: 'reportsSalesDaily' },
  { to: '/reports/sales/period-compare', key: 'reportsSalesPeriodCompare', icon: ArrowLeftRight, moduleId: 'reportsSalesPeriodCompare' },
  { to: '/reports/sales/by-stores', key: 'reportsSalesByStores', icon: Store, moduleId: 'reportsSalesByStores' },
  { to: '/reports/sales/by-categories', key: 'reportsSalesByCategories', icon: Tags, moduleId: 'reportsSalesByCategories' },
  { to: '/reports/sales/by-products', key: 'reportsSalesByProducts', icon: Package, moduleId: 'reportsSalesByProducts' },
  { to: '/reports/sales', key: 'reportsSales', icon: Receipt, moduleId: 'reportsSales' },
  { to: '/reports/sales/cashiers', key: 'reportsCashierPerformance', icon: UserCog, moduleId: 'reportsCashierPerformance' },
  { to: '/reports/returns', key: 'reportsReturns', icon: RotateCcw, moduleId: 'reportsReturns' },
];

export const REPORTS_HUB_STOCK_LINKS = [
  { to: '/reports/stock', key: 'reportsStockDashboard', icon: Warehouse, moduleId: 'reportsStockDashboard' },
  { to: '/reports/stock/balances', key: 'reportsStockBalances', icon: Package, moduleId: 'reportsStockBalances' },
  { to: '/reports/stock/low', key: 'reportsStockLow', icon: AlertTriangle, moduleId: 'reportsStockLow' },
  { to: '/reports/stock/dead', key: 'reportsStockDead', icon: AlertTriangle, moduleId: 'reportsStockDead' },
  { to: '/reports/stock/turnover', key: 'reportsStockTurnover', icon: ArrowLeftRight, moduleId: 'reportsStockTurnover' },
  { to: '/reports/stock/lifecycle', key: 'reportsStockLifecycle', icon: History, moduleId: 'reportsStockLifecycle' },
  { to: '/reports/stock/movements', key: 'reportsStockMovements', icon: ClipboardList, moduleId: 'reportsStockMovements' },
  { to: '/reports/stock/adjustments', key: 'reportsStockAdjustments', icon: ClipboardList, moduleId: 'reportsStockAdjustments' },
  { to: '/reports/stock/receipts', key: 'reportsStockReceipts', icon: Package, moduleId: 'reportsStockReceipts' },
  { to: '/reports/stock/write-offs', key: 'reportsStockWriteOffs', icon: TrendingDown, moduleId: 'reportsStockWriteOffs' },
  { to: '/reports/stock/inventories', key: 'reportsStockInventories', icon: ClipboardList, moduleId: 'reportsStockInventories' },
  { to: '/reports/stock/transfers', key: 'reportsStockTransfers', icon: Truck, moduleId: 'reportsStockTransfers' },
];

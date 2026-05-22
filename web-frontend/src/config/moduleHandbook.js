/** Маршрут → ключ справочника */
const ROUTE_MAP = [
  { test: (p) => p.startsWith('/cashier/pos'), id: 'cashierPos' },
  { test: (p) => p.startsWith('/cashier/sales'), id: 'cashierSales' },
  { test: (p) => p === '/dashboard', id: 'dashboard' },
  { test: (p) => p.startsWith('/products'), id: 'products' },
  { test: (p) => p.startsWith('/categories'), id: 'categories' },
  { test: (p) => p.startsWith('/stock/products'), id: 'stockProducts' },
  { test: (p) => p.startsWith('/stock/inventories'), id: 'stockInventories' },
  { test: (p) => p.startsWith('/stock/transfers'), id: 'stockTransfers' },
  { test: (p) => p.startsWith('/stock/receipts'), id: 'stockReceipts' },
  { test: (p) => p.startsWith('/stock/suppliers'), id: 'stockSuppliers' },
  { test: (p) => p.startsWith('/reports/stock/transfers'), id: 'reportsStockTransfers' },
  { test: (p) => p.startsWith('/reports/stock/inventories'), id: 'reportsStockInventories' },
  { test: (p) => p.startsWith('/reports/stock/dead'), id: 'reportsStockDead' },
  { test: (p) => p.startsWith('/reports/stock/adjustments'), id: 'reportsStockAdjustments' },
  { test: (p) => p.startsWith('/reports/stock/balances'), id: 'reportsStockBalances' },
  { test: (p) => p.startsWith('/reports/stock/turnover'), id: 'reportsStockTurnover' },
  { test: (p) => p.startsWith('/reports/stock/movements'), id: 'reportsStockMovements' },
  { test: (p) => p.startsWith('/reports/stock/receipts'), id: 'reportsStockReceipts' },
  { test: (p) => p.startsWith('/reports/stock/write-offs'), id: 'reportsStockWriteOffs' },
  { test: (p) => p.startsWith('/reports/stock/low'), id: 'reportsStockLow' },
  { test: (p) => p.startsWith('/reports/stock'), id: 'reportsStockDashboard' },
  { test: (p) => p.startsWith('/reports/sales/period-compare'), id: 'reportsSalesPeriodCompare' },
  { test: (p) => p.startsWith('/reports/sales/daily'), id: 'reportsSalesDaily' },
  { test: (p) => p.startsWith('/reports/sales/cashiers'), id: 'reportsCashierPerformance' },
  { test: (p) => p.startsWith('/reports/sales/by-stores'), id: 'reportsSalesByStores' },
  { test: (p) => p.startsWith('/reports/sales/by-categories'), id: 'reportsSalesByCategories' },
  { test: (p) => p.startsWith('/reports/sales/by-products'), id: 'reportsSalesByProducts' },
  { test: (p) => p.startsWith('/reports/sales'), id: 'reportsSales' },
  { test: (p) => p.startsWith('/reports/returns'), id: 'reportsReturns' },
  { test: (p) => p.startsWith('/reports/analytics'), id: 'reportsAnalytics' },
  { test: (p) => p.startsWith('/orders'), id: 'ordersList' },
  { test: (p) => p.startsWith('/cash-registers/list'), id: 'registersList' },
  { test: (p) => p.startsWith('/cash-registers/z-reports'), id: 'registersZReports' },
  { test: (p) => p.startsWith('/cash-registers/transfer'), id: 'registersTransfer' },
  { test: (p) => p.startsWith('/cash-registers/config'), id: 'registersConfig' },
  { test: (p) => p.startsWith('/stores'), id: 'stores' },
  { test: (p) => p.startsWith('/users/barcode-print'), id: 'usersBarcodePrint' },
  { test: (p) => p.startsWith('/users/printer-settings'), id: 'usersPrinterSettings' },
  { test: (p) => p.startsWith('/users/branding-settings'), id: 'usersBrandingSettings' },
  { test: (p) => p.startsWith('/users'), id: 'usersList' },
  { test: (p) => p.startsWith('/checkout'), id: 'checkout' },
];

export const HANDBOOK_GROUPS = {
  admin: ['main', 'goods', 'stock', 'orders', 'registers', 'reports', 'settings', 'cashier'],
  cashier: ['cashier'],
};

export const ADMIN_MODULE_IDS = [
  { id: 'dashboard', group: 'main', roles: ['ADMIN', 'MANAGER'] },
  { id: 'products', group: 'goods', roles: ['ADMIN', 'MANAGER'] },
  { id: 'categories', group: 'goods', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockProducts', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockSuppliers', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockReceipts', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockInventories', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stockTransfers', group: 'stock', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsAnalytics', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesDaily', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesPeriodCompare', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesByStores', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesByCategories', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSalesByProducts', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsSales', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsCashierPerformance', group: 'reports', roles: ['ADMIN'] },
  { id: 'reportsReturns', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockDashboard', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockBalances', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockLow', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockDead', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockTurnover', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockMovements', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockAdjustments', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockReceipts', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockWriteOffs', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockInventories', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'reportsStockTransfers', group: 'reports', roles: ['ADMIN', 'MANAGER'] },
  { id: 'ordersList', group: 'orders', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersList', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersZReports', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersTransfer', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'registersConfig', group: 'registers', roles: ['ADMIN', 'MANAGER'] },
  { id: 'stores', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersList', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersPrinterSettings', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersBrandingSettings', group: 'settings', roles: ['ADMIN'] },
  { id: 'usersBarcodePrint', group: 'settings', roles: ['ADMIN'] },
  { id: 'checkout', group: 'main', roles: ['ADMIN', 'MANAGER'] },
];

export const CASHIER_MODULE_IDS = [
  { id: 'cashierPos', group: 'cashier', roles: ['CASHIER', 'ADMIN', 'MANAGER'] },
  { id: 'cashierSales', group: 'cashier', roles: ['CASHIER', 'ADMIN', 'MANAGER'] },
];

export function resolveHandbookModuleId(pathname) {
  if (pathname.startsWith('/handbook/')) {
    const id = pathname.slice('/handbook/'.length).split('/')[0];
    return id || 'dashboard';
  }
  if (pathname.startsWith('/cashier/handbook/')) {
    const id = pathname.slice('/cashier/handbook/'.length).split('/')[0];
    return id || 'cashierPos';
  }
  const hit = ROUTE_MAP.find((r) => r.test(pathname));
  return hit?.id ?? 'dashboard';
}

export function modulesForScope(scope, userRole, allowedModules) {
  const list = scope === 'cashier' ? CASHIER_MODULE_IDS : ADMIN_MODULE_IDS;
  if (Array.isArray(allowedModules) && allowedModules.length > 0) {
    return list.filter((m) => allowedModules.includes(m.id));
  }
  if (!userRole) return list;
  return list.filter((m) => m.roles.includes(userRole));
}

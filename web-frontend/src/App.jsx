// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import ThemedToaster from './components/shared/ThemedToaster';

import LoginPage         from './pages/LoginPage';
import CashierPinLoginPage from './pages/cashier/CashierPinLoginPage';
import DesktopInstallerPage from './pages/DesktopInstallerPage';
import DashboardPage     from './pages/DashboardPage';
import ProductsPage      from './pages/ProductsPage';
import CategoriesPage    from './pages/CategoriesPage';
import ReportsPage       from './pages/ReportsPage';
import SalesLedgerPage   from './pages/SalesLedgerPage';
import ReturnsPage       from './pages/ReturnsPage';
import ProductSalesReportPage from './pages/reports/ProductSalesReportPage';
import CategorySalesReportPage from './pages/reports/CategorySalesReportPage';
import StoreSalesReportPage from './pages/reports/StoreSalesReportPage';
import PeriodCompareReportPage from './pages/reports/PeriodCompareReportPage';
import DailySummaryReportPage from './pages/reports/DailySummaryReportPage';
import CashierPerformanceReportPage from './pages/reports/CashierPerformanceReportPage';
import StockDashboardPage from './pages/reports/StockDashboardPage';
import WriteOffsReportPage from './pages/reports/WriteOffsReportPage';
import LowStockReportPage from './pages/reports/LowStockReportPage';
import StockTurnoverPage from './pages/reports/StockTurnoverPage';
import StockMovementsPage from './pages/reports/StockMovementsPage';
import StockReceiptsReportPage from './pages/reports/StockReceiptsReportPage';
import StockBalancesReportPage from './pages/reports/StockBalancesReportPage';
import StockAdjustmentsReportPage from './pages/reports/StockAdjustmentsReportPage';
import DeadStockReportPage from './pages/reports/DeadStockReportPage';
import StockInventoriesReportPage from './pages/reports/StockInventoriesReportPage';
import StockTransfersReportPage from './pages/reports/StockTransfersReportPage';
import ProductLifecycleReportPage from './pages/reports/ProductLifecycleReportPage';
import ReportsHubPage from './pages/reports/ReportsHubPage';
import StockReceiptCreatePage from './pages/stock/StockReceiptCreatePage';
import StockInventoryCreatePage from './pages/stock/StockInventoryCreatePage';
import StockTransferCreatePage from './pages/stock/StockTransferCreatePage';
import StockProductsPage from './pages/StockProductsPage';
import SuppliersPage     from './pages/SuppliersPage';
import UsersPage         from './pages/UsersPage';
import UsersPrinterSettingsPage from './pages/UsersPrinterSettingsPage';
import UsersBrandingSettingsPage from './pages/UsersBrandingSettingsPage';
import UsersBarcodePrintPage from './pages/UsersBarcodePrintPage';
import StoresPage        from './pages/StoresPage';
import ReceiptPage       from './pages/ReceiptPage';
import CashRegistersListPage from './pages/CashRegistersListPage';
import CashRegisterConfigPage from './pages/CashRegisterConfigPage';
import CashRegisterTransferPage from './pages/CashRegisterTransferPage';
import ZReportsPage from './pages/ZReportsPage';
import OrdersListPage from './pages/OrdersListPage';
import AppShellLayout    from './components/layout/AppShellLayout';
import SuperAdminLayout  from './components/layout/SuperAdminLayout';
import PlatformCompaniesPage from './pages/platform/PlatformCompaniesPage';
import PlatformStoresPage from './pages/platform/PlatformStoresPage';
import PlatformUsersPage from './pages/platform/PlatformUsersPage';
import PlatformModuleAccessPage from './pages/platform/PlatformModuleAccessPage';
import PlatformMonitoringPage from './pages/platform/PlatformMonitoringPage';
import PlatformEmailPage from './pages/platform/PlatformEmailPage';
import { useModuleAccess } from './hooks/useModuleAccess';
import HtmlLangSync      from './components/shared/HtmlLangSync';
import AuthBootstrap     from './components/shared/AuthBootstrap';
import TenantDisplayBootstrap from './components/shared/TenantDisplayBootstrap';
import UnitsCatalogBootstrap from './components/shared/UnitsCatalogBootstrap';
import CashierLayout     from './components/layout/CashierLayout';
import PosPage           from './pages/cashier/PosPage';
import CashierMySalesPage from './pages/cashier/CashierMySalesPage';
import HandbookPage from './pages/HandbookPage';
import SupportPage from './pages/SupportPage';
import AiAssistantPage from './pages/AiAssistantPage';

function AuthRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function CashierRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/cashier/login" replace />;
  if (user?.role !== 'CASHIER') return <Navigate to="/dashboard" replace />;
  return children;
}

function ProtectedRoute({ children, requiredRole, module: moduleId }) {
  const { isAuthenticated, user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/platform" replace />;
  if (user?.role === 'CASHIER') return <Navigate to="/cashier/pos" replace />;
  if (requiredRole && user?.role !== requiredRole && !['ADMIN'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (moduleId && !hasModule(moduleId)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function CheckoutRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'CASHIER') return <Navigate to="/cashier/pos" replace />;
  return <Navigate to="/dashboard" replace />;
}

function SuperAdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HtmlLangSync />
      <BrowserRouter>
        <AuthBootstrap>
          <TenantDisplayBootstrap>
          <UnitsCatalogBootstrap>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cashier/login" element={<CashierPinLoginPage />} />
          <Route path="/install" element={<DesktopInstallerPage />} />

          <Route path="/receipt/:receiptNumber" element={
            <AuthRoute><ReceiptPage /></AuthRoute>
          } />

          <Route path="/cashier" element={
            <CashierRoute><CashierLayout /></CashierRoute>
          }>
            <Route index element={<Navigate to="/cashier/pos" replace />} />
            <Route path="pos" element={<PosPage />} />
            <Route path="sales" element={<CashierMySalesPage />} />
            <Route path="handbook" element={<HandbookPage scope="cashier" />} />
            <Route path="handbook/:moduleId" element={<HandbookPage scope="cashier" />} />
            <Route path="support" element={<SupportPage />} />
          </Route>

          <Route path="/platform" element={
            <SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>
          }>
            <Route index element={<Navigate to="/platform/companies" replace />} />
            <Route path="companies" element={<PlatformCompaniesPage />} />
            <Route path="stores" element={<PlatformStoresPage />} />
            <Route path="users" element={<PlatformUsersPage />} />
            <Route path="access" element={<PlatformModuleAccessPage />} />
            <Route path="monitoring" element={<PlatformMonitoringPage />} />
            <Route path="email" element={<PlatformEmailPage />} />
          </Route>

          <Route path="/" element={
            <ProtectedRoute><AppShellLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <ProtectedRoute module="dashboard"><DashboardPage /></ProtectedRoute>
            } />
            <Route path="assistant" element={
              <ProtectedRoute requiredRole="ADMIN" module="aiAssistant"><AiAssistantPage /></ProtectedRoute>
            } />
            <Route path="products" element={
              <ProtectedRoute module="products"><ProductsPage /></ProtectedRoute>
            } />
            <Route path="categories" element={
              <ProtectedRoute module="categories"><CategoriesPage /></ProtectedRoute>
            } />
            <Route path="stock/products" element={
              <ProtectedRoute module="stockProducts"><StockProductsPage /></ProtectedRoute>
            } />
            <Route path="stock/receipts/new" element={
              <ProtectedRoute requiredRole="MANAGER" module="stockReceipts"><StockReceiptCreatePage /></ProtectedRoute>
            } />
            <Route path="stock/inventories/new" element={
              <ProtectedRoute requiredRole="MANAGER" module="stockInventories"><StockInventoryCreatePage /></ProtectedRoute>
            } />
            <Route path="stock/transfers/new" element={
              <ProtectedRoute requiredRole="MANAGER" module="stockTransfers"><StockTransferCreatePage /></ProtectedRoute>
            } />
            <Route path="stock/suppliers" element={
              <ProtectedRoute module="stockSuppliers"><SuppliersPage /></ProtectedRoute>
            } />
            <Route path="orders/list" element={
              <ProtectedRoute requiredRole="MANAGER" module="ordersList"><OrdersListPage /></ProtectedRoute>
            } />
            <Route path="orders" element={<Navigate to="/orders/list" replace />} />
            <Route path="checkout" element={<CheckoutRedirect />} />
            <Route path="reports/sales/by-products" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByProducts"><ProductSalesReportPage /></ProtectedRoute>
            } />
            <Route path="reports/sales/by-categories" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByCategories"><CategorySalesReportPage /></ProtectedRoute>
            } />
            <Route path="reports/sales/by-stores" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByStores"><StoreSalesReportPage /></ProtectedRoute>
            } />
            <Route path="reports/sales/period-compare" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsSalesPeriodCompare"><PeriodCompareReportPage /></ProtectedRoute>
            } />
            <Route path="reports/sales/daily" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsSalesDaily"><DailySummaryReportPage /></ProtectedRoute>
            } />
            <Route path="reports/sales/cashiers" element={
              <ProtectedRoute requiredRole="ADMIN" module="reportsCashierPerformance"><CashierPerformanceReportPage /></ProtectedRoute>
            } />
            <Route path="reports/sales" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsSales"><SalesLedgerPage /></ProtectedRoute>
            } />
            <Route path="reports/returns" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsReturns"><ReturnsPage /></ProtectedRoute>
            } />
            <Route path="reports/analytics" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsAnalytics"><ReportsPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/write-offs" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockWriteOffs"><WriteOffsReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/low" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockLow"><LowStockReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/turnover" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockTurnover"><StockTurnoverPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/movements" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockMovements"><StockMovementsPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/receipts" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockReceipts"><StockReceiptsReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/balances" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockBalances"><StockBalancesReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/adjustments" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockAdjustments"><StockAdjustmentsReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/dead" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockDead"><DeadStockReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/inventories" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockInventories"><StockInventoriesReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/transfers" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockTransfers"><StockTransfersReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock/lifecycle" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockLifecycle"><ProductLifecycleReportPage /></ProtectedRoute>
            } />
            <Route path="reports/stock" element={
              <ProtectedRoute requiredRole="MANAGER" module="reportsStockDashboard"><StockDashboardPage /></ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute requiredRole="MANAGER"><ReportsHubPage /></ProtectedRoute>
            } />
            <Route path="cash-registers/list" element={
              <ProtectedRoute requiredRole="MANAGER" module="registersList"><CashRegistersListPage /></ProtectedRoute>
            } />
            <Route path="cash-registers/z-reports" element={
              <ProtectedRoute requiredRole="MANAGER" module="registersZReports"><ZReportsPage /></ProtectedRoute>
            } />
            <Route path="cash-registers/transfer" element={
              <ProtectedRoute requiredRole="MANAGER" module="registersTransfer"><CashRegisterTransferPage /></ProtectedRoute>
            } />
            <Route path="cash-registers/config" element={
              <ProtectedRoute requiredRole="MANAGER" module="registersConfig"><CashRegisterConfigPage /></ProtectedRoute>
            } />
            <Route path="cash-registers" element={<Navigate to="/cash-registers/list" replace />} />
            <Route path="stores" element={
              <ProtectedRoute requiredRole="ADMIN" module="stores"><StoresPage /></ProtectedRoute>
            } />
            <Route path="users/list" element={
              <ProtectedRoute requiredRole="ADMIN" module="usersList"><UsersPage /></ProtectedRoute>
            } />
            <Route path="users/printer-settings" element={
              <ProtectedRoute requiredRole="ADMIN" module="usersPrinterSettings"><UsersPrinterSettingsPage /></ProtectedRoute>
            } />
            <Route path="users/branding-settings" element={
              <ProtectedRoute requiredRole="ADMIN" module="usersBrandingSettings"><UsersBrandingSettingsPage /></ProtectedRoute>
            } />
            <Route path="users/barcode-print" element={
              <ProtectedRoute module="usersBarcodePrint"><UsersBarcodePrintPage /></ProtectedRoute>
            } />
            <Route path="users" element={<Navigate to="/users/list" replace />} />
            <Route path="handbook" element={<HandbookPage scope="admin" />} />
            <Route path="handbook/:moduleId" element={<HandbookPage scope="admin" />} />
            <Route path="support" element={<SupportPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
          </UnitsCatalogBootstrap>
          </TenantDisplayBootstrap>
        </AuthBootstrap>
      </BrowserRouter>
      <ThemedToaster />
    </QueryClientProvider>
  );
}

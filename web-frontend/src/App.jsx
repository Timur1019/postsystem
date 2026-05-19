// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import ThemedToaster from './components/shared/ThemedToaster';

import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import ProductsPage      from './pages/ProductsPage';
import CategoriesPage    from './pages/CategoriesPage';
import ReportsPage       from './pages/ReportsPage';
import SalesLedgerPage   from './pages/SalesLedgerPage';
import ReturnsPage       from './pages/ReturnsPage';
import StockProductsPage from './pages/StockProductsPage';
import SuppliersPage     from './pages/SuppliersPage';
import UsersPage         from './pages/UsersPage';
import StoresPage        from './pages/StoresPage';
import ReceiptPage       from './pages/ReceiptPage';
import CashRegistersListPage from './pages/CashRegistersListPage';
import CashRegisterConfigPage from './pages/CashRegisterConfigPage';
import CashRegisterTransferPage from './pages/CashRegisterTransferPage';
import ZReportsPage from './pages/ZReportsPage';
import OrdersListPage from './pages/OrdersListPage';
import AppLayout         from './components/layout/AppLayout';
import SuperAdminLayout  from './components/layout/SuperAdminLayout';
import PlatformCompaniesPage from './pages/platform/PlatformCompaniesPage';
import PlatformStoresPage from './pages/platform/PlatformStoresPage';
import PlatformUsersPage from './pages/platform/PlatformUsersPage';
import HtmlLangSync      from './components/shared/HtmlLangSync';
import AuthBootstrap     from './components/shared/AuthBootstrap';
import CashierLayout     from './components/layout/CashierLayout';
import PosPage           from './pages/cashier/PosPage';
import CashierMySalesPage from './pages/cashier/CashierMySalesPage';
import HandbookPage from './pages/HandbookPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function CashierRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role !== 'CASHIER') return <Navigate to="/dashboard" replace />;
  return children;
}

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/platform" replace />;
  if (user?.role === 'CASHIER') return <Navigate to="/cashier/pos" replace />;
  if (requiredRole && user?.role !== requiredRole && !['ADMIN'].includes(user?.role)) {
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />

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
          </Route>

          <Route path="/platform" element={
            <SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>
          }>
            <Route index element={<Navigate to="/platform/companies" replace />} />
            <Route path="companies" element={<PlatformCompaniesPage />} />
            <Route path="stores" element={<PlatformStoresPage />} />
            <Route path="users" element={<PlatformUsersPage />} />
          </Route>

          <Route path="/" element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="products"   element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="stock/products" element={<StockProductsPage />} />
            <Route path="stock/suppliers" element={<SuppliersPage />} />
            <Route path="orders/list" element={
              <ProtectedRoute requiredRole="MANAGER"><OrdersListPage /></ProtectedRoute>
            } />
            <Route path="orders" element={<Navigate to="/orders/list" replace />} />
            <Route path="checkout" element={<CheckoutRedirect />} />
            <Route path="reports/sales" element={
              <ProtectedRoute requiredRole="MANAGER"><SalesLedgerPage /></ProtectedRoute>
            } />
            <Route path="reports/returns" element={
              <ProtectedRoute requiredRole="MANAGER"><ReturnsPage /></ProtectedRoute>
            } />
            <Route path="reports/analytics" element={
              <ProtectedRoute requiredRole="MANAGER"><ReportsPage /></ProtectedRoute>
            } />
            <Route path="reports" element={<Navigate to="/reports/sales" replace />} />
            <Route path="cash-registers/list" element={
              <ProtectedRoute requiredRole="MANAGER"><CashRegistersListPage /></ProtectedRoute>
            } />
            <Route path="cash-registers/z-reports" element={
              <ProtectedRoute requiredRole="MANAGER"><ZReportsPage /></ProtectedRoute>
            } />
            <Route path="cash-registers/transfer" element={
              <ProtectedRoute requiredRole="MANAGER"><CashRegisterTransferPage /></ProtectedRoute>
            } />
            <Route path="cash-registers/config" element={
              <ProtectedRoute requiredRole="MANAGER"><CashRegisterConfigPage /></ProtectedRoute>
            } />
            <Route path="cash-registers" element={<Navigate to="/cash-registers/list" replace />} />
            <Route path="stores" element={
              <ProtectedRoute requiredRole="ADMIN"><StoresPage /></ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute requiredRole="ADMIN"><UsersPage /></ProtectedRoute>
            } />
            <Route path="handbook" element={<HandbookPage scope="admin" />} />
            <Route path="handbook/:moduleId" element={<HandbookPage scope="admin" />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </AuthBootstrap>
      </BrowserRouter>
      <ThemedToaster />
    </QueryClientProvider>
  );
}

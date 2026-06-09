import { Route, Navigate } from 'react-router-dom';
import SuperAdminRoute from './guards/SuperAdminRoute';
import SuperAdminLayout from '../components/layout/SuperAdminLayout';
import {
  PlatformCompaniesPage,
  PlatformStoresPage,
  PlatformUsersPage,
  PlatformModuleAccessPage,
  PlatformMonitoringPage,
  PlatformEmailPage,
  PlatformSecurityPage,
  PlatformBusinessTypesPage,
} from './lazyPages';

export const platformRoutes = (
  <Route
    path="/platform"
    element={(
      <SuperAdminRoute>
        <SuperAdminLayout />
      </SuperAdminRoute>
    )}
  >
    <Route index element={<Navigate to="/platform/companies" replace />} />
    <Route path="companies" element={<PlatformCompaniesPage />} />
    <Route path="stores" element={<PlatformStoresPage />} />
    <Route path="users" element={<PlatformUsersPage />} />
    <Route path="access" element={<PlatformModuleAccessPage />} />
    <Route path="monitoring" element={<PlatformMonitoringPage />} />
    <Route path="email" element={<PlatformEmailPage />} />
    <Route path="security" element={<PlatformSecurityPage />} />
    <Route path="business-types" element={<PlatformBusinessTypesPage />} />
  </Route>
);

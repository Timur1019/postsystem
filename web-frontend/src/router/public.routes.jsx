import { Route } from 'react-router-dom';
import AuthRoute from './guards/AuthRoute';
import {
  LoginPage,
  CashierPinLoginPage,
  DesktopInstallerPage,
  ReceiptPage,
} from './lazyPages';

export const publicRoutes = (
  <>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cashier/login" element={<CashierPinLoginPage />} />
    <Route path="/install" element={<DesktopInstallerPage />} />
    <Route
      path="/receipt/:receiptNumber"
      element={(
        <AuthRoute>
          <ReceiptPage />
        </AuthRoute>
      )}
    />
  </>
);

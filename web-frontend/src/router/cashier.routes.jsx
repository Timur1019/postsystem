import { Route, Navigate } from 'react-router-dom';
import CashierRoute from './guards/CashierRoute';
import CashierLayout from '../components/layout/CashierLayout';
import {
  PosPage,
  CashierMySalesPage,
  HandbookPage,
  SupportPage,
} from './lazyPages';

export const cashierRoutes = (
  <Route
    path="/cashier"
    element={(
      <CashierRoute>
        <CashierLayout />
      </CashierRoute>
    )}
  >
    <Route index element={<Navigate to="/cashier/pos" replace />} />
    <Route path="pos" element={<PosPage />} />
    <Route path="sales" element={<CashierMySalesPage />} />
    <Route path="handbook" element={<HandbookPage scope="cashier" />} />
    <Route path="handbook/:moduleId" element={<HandbookPage scope="cashier" />} />
    <Route path="support" element={<SupportPage />} />
  </Route>
);

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function CashierRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/cashier/login" replace />;
  if (user?.role !== 'CASHIER') return <Navigate to="/dashboard" replace />;
  return children;
}

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function CheckoutRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'CASHIER') return <Navigate to="/cashier/pos" replace />;
  return <Navigate to="/dashboard" replace />;
}

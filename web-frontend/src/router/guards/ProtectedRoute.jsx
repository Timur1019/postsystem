import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { isDesktopCashier } from '../../utils/authLogin';

export default function ProtectedRoute({ children, requiredRole, module: moduleId }) {
  const { isAuthenticated, user } = useAuthStore();
  const { hasModule } = useModuleAccess();
  const location = useLocation();
  if (!isAuthenticated()) {
    // Первый заход на сайт (корень) в браузере — на лендинг скачивания кассы.
    const landOnInstall = location.pathname === '/' && !isDesktopCashier();
    return <Navigate to={landOnInstall ? '/install' : '/login'} replace />;
  }
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

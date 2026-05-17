// src/components/layout/CashierLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Receipt, LogOut, Store, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useCashierStore } from '../../hooks/useCashierStore';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import ThemeToggle from '../shared/ThemeToggle';
import { APP_NAME } from '../../config/brand';

function displayName(user) {
  if (!user) return '';
  const parts = [user.lastName, user.firstName, user.patronymic].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.username ?? '';
}

export default function CashierLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { storeName } = useCashierStore();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-500 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="cashier-layout flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <header className="shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
              <ShoppingCart size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{APP_NAME}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{displayName(user)}</p>
              {storeName && (
                <p className="truncate text-xs text-emerald-600 dark:text-emerald-400">
                  <Store size={12} className="mr-0.5 inline" aria-hidden />
                  {storeName}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/cashier/pos" className={linkClass}>
                <ShoppingCart size={16} />
                {t('pos.navSale')}
              </NavLink>
              <NavLink to="/cashier/sales" className={linkClass}>
                <Receipt size={16} />
                {t('pos.navMySales')}
              </NavLink>
              <NavLink to="/cashier/handbook/cashierPos" className={linkClass}>
                <BookOpen size={16} />
                {t('nav.handbook')}
              </NavLink>
            </nav>
            <div className="flex items-center gap-1 border-slate-200 pl-0 sm:border-l sm:pl-2 dark:border-slate-700">
              <ThemeToggle />
              <LanguageSwitcher />
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title={t('common.logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-[1920px] overflow-auto p-3 sm:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

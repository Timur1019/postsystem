// src/components/layout/SuperAdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Building2, Store, Users, LogOut, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import ThemeToggle from '../shared/ThemeToggle';

const NAV = [
  { to: '/platform/companies', icon: Building2, key: 'platform.companies' },
  { to: '/platform/stores', icon: Store, key: 'platform.stores' },
  { to: '/platform/users', icon: Users, key: 'platform.users' },
];

export default function SuperAdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-500 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-5 dark:border-slate-800">
          <Shield className="text-emerald-500" size={22} />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{t('platform.title')}</p>
            <p className="text-xs text-slate-500">{t('platform.subtitle')}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <p className="mb-2 truncate px-2 text-xs text-slate-500">{user?.fullName}</p>
          <button type="button" onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10">
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <ThemeToggle />
          <LanguageSwitcher />
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

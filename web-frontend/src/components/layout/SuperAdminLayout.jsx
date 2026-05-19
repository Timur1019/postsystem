// src/components/layout/SuperAdminLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Store, Users, LogOut, Shield, Menu, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../shared/LanguageSwitcher';

const NAV = [
  { to: '/platform/companies', icon: Building2, key: 'platform.companies' },
  { to: '/platform/stores', icon: Store, key: 'platform.stores' },
  { to: '/platform/users', icon: Users, key: 'platform.users' },
  { to: '/platform/access', icon: KeyRound, key: 'platform.moduleAccess.nav' },
];

export default function SuperAdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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
    <div className="admin-shell flex min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-950">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(100vw,16rem)] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-5 dark:border-slate-800">
          <Shield className="shrink-0 text-emerald-500" size={22} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{t('platform.title')}</p>
            <p className="truncate text-xs text-slate-500">{t('platform.subtitle')}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} className="shrink-0" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <p className="mb-2 truncate px-2 text-xs text-slate-500">{user?.fullName}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:h-auto sm:px-4 sm:py-3 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t('nav.expandMenu')}
          >
            <Menu size={20} />
          </button>
          <p className="truncate text-sm font-semibold text-slate-900 lg:hidden dark:text-white">{t('platform.title')}</p>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex"
              onClick={handleLogout}
              aria-label={t('nav.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="admin-main flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

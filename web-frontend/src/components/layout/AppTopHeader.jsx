import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '../shared/LanguageSwitcher';

export default function AppTopHeader({
  t,
  user,
  roleLabel,
  displayAppName,
  isDesktop,
  sidebarOpen,
  mobileNavOpen,
  onToggleSidebar,
}) {
  return (
    <header className="print:hidden flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:h-16 sm:px-4 md:px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={mobileNavOpen || sidebarOpen ? t('nav.closeMenu') : t('nav.expandMenu')}
        >
          {isDesktop ? (sidebarOpen ? <X size={20} /> : <Menu size={20} />) : <Menu size={20} />}
        </button>
        <div className="min-w-0 lg:hidden">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{displayAppName()}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.fullName}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
        <LanguageSwitcher />
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 font-bold text-white">
            {user?.fullName?.[0] ?? 'U'}
          </div>
          <div className="hidden md:block">
            <div className="font-medium text-slate-900 dark:text-white">{user?.fullName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}


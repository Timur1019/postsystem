import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import BrandMark from '../../../components/shared/BrandMark';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { cashierLoginPath } from '../../../utils/authLogin';

/** Верхняя навигация лендинга /install: бренд слева, вход и язык справа. */
export default function DesktopInstallerNav({ t }) {
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
            <BrandMark size={20} iconClassName="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            {displayAppName()}
          </span>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to={cashierLoginPath()}
            className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:inline"
          >
            {t('cashierLogin.backToCashier', { defaultValue: 'Вход кассира' })}
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <LogIn size={16} />
            {t('installer.goToLogin')}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}

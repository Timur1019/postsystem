import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';

export default function LoginFooterLinks({ t, cashierLoginPath, isDesktop }) {
  return (
    <>
      <p className="mt-6 text-center text-xs text-slate-500">
        {t('login.footer', { year: new Date().getFullYear() })}
      </p>
      <p className="mt-3 text-center text-sm">
        <Link
          to={cashierLoginPath()}
          className="font-medium text-slate-500 hover:text-slate-700"
        >
          {t('cashierLogin.backToCashier', { defaultValue: 'Вход кассира' })}
        </Link>
      </p>
      {!isDesktop && (
        <p className="mt-3 text-center text-sm">
          <Link
            to="/install"
            className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Download size={16} />
            {t('login.downloadCashier')}
          </Link>
        </p>
      )}
    </>
  );
}

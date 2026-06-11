import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';

/** Шапка страницы логина: ссылки «Вход кассира» и «Скачать кассу» слева сверху. */
export default function LoginHeaderLinks({ t, cashierLoginPath, isDesktop }) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-5">
      <Link
        to={cashierLoginPath()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        {t('cashierLogin.backToCashier', { defaultValue: 'Вход кассира' })}
      </Link>
      {!isDesktop && (
        <Link
          to="/install"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
        >
          <Download size={16} />
          {t('login.downloadCashier')}
        </Link>
      )}
    </div>
  );
}

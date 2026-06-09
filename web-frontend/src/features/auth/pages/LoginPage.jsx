import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import LoginBranding from '../components/LoginBranding';
import LoginForm from '../components/LoginForm';
import LoginFooterLinks from '../components/LoginFooterLinks';
import { useLoginPage } from '../hooks/useLoginPage';

export default function LoginPage() {
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const {
    t,
    isDesktop,
    cashierLoginPath,
    shouldRedirectToCashierLogin,
    showPass,
    toggleShowPass,
    loading,
    form,
    onSubmit,
  } = useLoginPage();

  if (shouldRedirectToCashierLogin) {
    return <Navigate to={cashierLoginPath()} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      {isDesktop ? (
        <div className="absolute top-4 left-4">
          <Link
            to={cashierLoginPath()}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            {t('cashierLogin.backToCashier', { defaultValue: 'Вход кассира' })}
          </Link>
        </div>
      ) : null}
      <div className="w-full max-w-md">
        <LoginBranding appName={displayAppName()} subtitle={t('login.subtitle')} />
        <LoginForm
          t={t}
          form={form}
          showPass={showPass}
          onToggleShowPass={toggleShowPass}
          loading={loading}
          onSubmit={onSubmit}
        />
        <LoginFooterLinks t={t} cashierLoginPath={cashierLoginPath} isDesktop={isDesktop} />
      </div>
    </div>
  );
}

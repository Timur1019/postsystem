import { Navigate } from 'react-router-dom';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import LoginBranding from '../components/LoginBranding';
import LoginForm from '../components/LoginForm';
import LoginHeaderLinks from '../components/LoginHeaderLinks';
import LoginFooter from '../components/LoginFooter';
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
      <LoginHeaderLinks t={t} cashierLoginPath={cashierLoginPath} isDesktop={isDesktop} />
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
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
        <LoginFooter t={t} />
      </div>
    </div>
  );
}

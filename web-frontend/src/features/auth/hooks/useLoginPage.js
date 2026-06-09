import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { resetClientSessionState } from '../../../utils/authSession';
import { resolveAuthErrorMessage } from '../../../utils/apiError';
import { isDesktopCashier, cashierLoginPath } from '../../../utils/authLogin';

function resolvePostLoginPath(role) {
  if (role === 'SUPER_ADMIN') return '/platform';
  if (role === 'CASHIER') return '/cashier/pos';
  return '/dashboard';
}

export function useLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDesktop = Boolean(window.desktopCashier?.isDesktop);
  const isAdminLogin = searchParams.get('admin') === '1';
  const shouldRedirectToCashierLogin = isDesktopCashier() && !isAdminLogin;

  useEffect(() => {
    if (!hasHydrated || !token) return;
    navigate(resolvePostLoginPath(user?.role), { replace: true });
  }, [hasHydrated, token, user, navigate]);

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t('validation.required')),
        password: z.string().min(1, t('validation.required')),
      }),
    [t]
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login({
        username: data.username,
        password: data.password,
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        toast.error(t('login.failed'));
        return;
      }
      resetClientSessionState();
      setAuth(accessToken, profile);
      toast.success(t('login.welcome', { name: profile.fullName }));
      navigate(resolvePostLoginPath(profile.role), { replace: true });
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      if (!err.response) {
        toast.error(t('login.networkError'), { id: 'login-network-error' });
      } else if (apiMsg === 'Invalid username or password') {
        toast.error(t('login.badCredentials'));
      } else {
        toast.error(resolveAuthErrorMessage(err, t));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    t,
    isDesktop,
    cashierLoginPath,
    shouldRedirectToCashierLogin,
    showPass,
    toggleShowPass: () => setShowPass((v) => !v),
    loading,
    form,
    onSubmit: form.handleSubmit(onSubmit),
  };
}

// src/pages/LoginPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Eye, EyeOff, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import ThemeToggle from '../components/shared/ThemeToggle';
import { APP_NAME } from '../config/brand';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    if (user?.role === 'SUPER_ADMIN') navigate('/platform', { replace: true });
    else if (user?.role === 'CASHIER') navigate('/cashier/pos', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [hasHydrated, token, user, navigate]);

  const schema = useMemo(() => z.object({
    username: z.string().min(1, t('validation.required')),
    password: z.string().min(1, t('validation.required')),
  }), [t]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { token, ...profile } = res.data;
      if (!token) {
        toast.error(t('login.failed'));
        return;
      }
      setAuth(token, profile);
      toast.success(t('login.welcome', { name: profile.fullName }));
      const target =
        profile.role === 'SUPER_ADMIN'
          ? '/platform'
          : profile.role === 'CASHIER'
            ? '/cashier/pos'
            : '/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      if (!err.response) {
        toast.error(t('login.networkError'));
      } else if (apiMsg) {
        toast.error(apiMsg === 'Invalid username or password' ? t('login.badCredentials') : apiMsg);
      } else {
        toast.error(t('login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 mb-4">
            <ShoppingCart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('login.subtitle')}</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('login.username')}</label>
            <input
              {...register('username')}
              autoComplete="username"
              placeholder={t('login.usernamePh')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition
                         placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500
                         dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('login.password')}</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-900 shadow-sm transition
                           placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500
                           dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
            {loading ? <Loader size={16} className="animate-spin" /> : null}
            {loading ? t('common.signingIn') : t('login.signIn')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          {t('login.footer', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}

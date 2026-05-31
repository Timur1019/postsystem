// src/pages/LoginPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import { useTenantDisplayStore } from '../store/tenantDisplayStore';
import BrandMark from '../components/shared/BrandMark';

const COMPANY_CODE_STORAGE_KEY = 'pos.companyLoginCode';

function readStoredCompanyCode() {
  try {
    return localStorage.getItem(COMPANY_CODE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function persistCompanyCode(code) {
  const normalized = (code || '').trim().toUpperCase();
  try {
    if (normalized) {
      localStorage.setItem(COMPANY_CODE_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(COMPANY_CODE_STORAGE_KEY);
    }
  } catch {
    // ignore private mode / quota
  }
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [desktopCompanyCode, setDesktopCompanyCode] = useState('');
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  const isDesktop = Boolean(window.desktopCashier?.isDesktop);
  const lockedCompanyCode = isDesktop && Boolean(desktopCompanyCode?.trim());

  useEffect(() => {
    if (!hasHydrated || !token) return;
    if (user?.role === 'SUPER_ADMIN') navigate('/platform', { replace: true });
    else if (user?.role === 'CASHIER') navigate('/cashier/pos', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [hasHydrated, token, user, navigate]);

  useEffect(() => {
    const fromUrl = searchParams.get('companyLoginCode');
    if (fromUrl) {
      persistCompanyCode(fromUrl);
    }
    if (window.desktopCashier?.getCompanyLoginCode) {
      window.desktopCashier.getCompanyLoginCode().then((code) => {
        if (code) {
          setDesktopCompanyCode(String(code).trim().toUpperCase());
          persistCompanyCode(code);
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  const defaultCompanyCode = useMemo(() => {
    const fromUrl = searchParams.get('companyLoginCode');
    if (fromUrl) return fromUrl.trim().toUpperCase();
    if (desktopCompanyCode) return desktopCompanyCode;
    return readStoredCompanyCode();
  }, [searchParams, desktopCompanyCode]);

  const schema = useMemo(() => z.object({
    companyLoginCode: z.string().optional(),
    username: z.string().min(1, t('validation.required')),
    password: z.string().min(1, t('validation.required')),
  }), [t]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      companyLoginCode: defaultCompanyCode,
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (defaultCompanyCode) {
      setValue('companyLoginCode', defaultCompanyCode);
    }
  }, [defaultCompanyCode, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const companyLoginCode = (lockedCompanyCode ? desktopCompanyCode : data.companyLoginCode || '')
        .trim()
        .toUpperCase();
      if (!lockedCompanyCode) {
        if (companyLoginCode) persistCompanyCode(companyLoginCode);
        else persistCompanyCode('');
      }
      const res = await authApi.login({
        companyLoginCode: companyLoginCode || undefined,
        username: data.username,
        password: data.password,
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        toast.error(t('login.failed'));
        return;
      }
      setAuth(accessToken, profile);
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
        toast.error(t('login.networkError'), { id: 'login-network-error' });
      } else if (apiMsg) {
        const msg =
          apiMsg === 'Invalid username or password'
            ? t('login.badCredentials')
            : apiMsg === 'Invalid company code'
              ? t('login.badCompanyCode')
              : apiMsg;
        toast.error(msg);
      } else {
        toast.error(t('login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <BrandMark size={32} iconClassName="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{displayAppName()}</h1>
          <p className="mt-1.5 text-base text-slate-600">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {lockedCompanyCode ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              <span className="font-semibold">{t('login.companyCode')}:</span>{' '}
              <span className="font-mono tracking-wide">{desktopCompanyCode}</span>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                {t('login.companyCode')}
              </label>
              <input
                {...register('companyLoginCode')}
                autoComplete="organization"
                placeholder={t('login.companyCodePh')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm uppercase tracking-wide text-slate-900 shadow-sm transition placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-slate-500">{t('login.companyCodeHint')}</p>
              {errors.companyLoginCode && (
                <p className="mt-1 text-sm text-red-500">{errors.companyLoginCode.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t('login.username')}
            </label>
            <input
              {...register('username')}
              autoComplete="username"
              placeholder={t('login.usernamePh')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {t('login.password')}
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-base font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : null}
            {loading ? t('common.signingIn') : t('login.signIn')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          {t('login.footer', { year: new Date().getFullYear() })}
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
      </div>
    </div>
  );
}

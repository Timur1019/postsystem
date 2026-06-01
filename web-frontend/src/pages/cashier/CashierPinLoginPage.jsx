import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const PIN_MIN = 4;
const PIN_MAX = 6;

function normalizePin(s) {
  return String(s || '').replace(/\D/g, '').slice(0, PIN_MAX);
}

export default function CashierPinLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [pin, setPin] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [loading, setLoading] = useState(false);

  const isDesktop = Boolean(window.desktopCashier?.isDesktop);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    if (user?.role === 'CASHIER') navigate('/cashier/pos', { replace: true });
  }, [hasHydrated, token, user, navigate]);

  useEffect(() => {
    const fromUrl = searchParams.get('companyLoginCode');
    if (fromUrl) setCompanyCode(String(fromUrl).trim().toUpperCase());
    if (window.desktopCashier?.getCompanyLoginCode) {
      window.desktopCashier
        .getCompanyLoginCode()
        .then((c) => {
          if (c) setCompanyCode(String(c).trim().toUpperCase());
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const canSubmit = useMemo(() => {
    return normalizePin(pin).length >= PIN_MIN && Boolean(companyCode.trim());
  }, [pin, companyCode]);

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const res = await authApi.cashierPinLogin({
        companyLoginCode: companyCode.trim().toUpperCase(),
        pin: normalizePin(pin),
      });
      const { token: accessToken, ...profile } = res.data;
      if (!accessToken) {
        toast.error(t('login.failed'));
        return;
      }
      setAuth(accessToken, profile);
      if (profile.role !== 'CASHIER') {
        toast.error(t('login.failed'));
        return;
      }
      navigate('/cashier/pos', { replace: true });
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      toast.error(apiMsg || t('login.failed'));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const pressDigit = (d) => setPin((p) => normalizePin(p + String(d)));
  const backspace = () => setPin((p) => normalizePin(p).slice(0, -1));
  const clear = () => setPin('');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        pressDigit(e.key);
        return;
      }
      if (e.key === 'Backspace') {
        backspace();
        return;
      }
      if (e.key === 'Enter') {
        submit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, canSubmit, companyCode, pin]);

  const dots = normalizePin(pin);

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} />
            {t('cashierLogin.adminLogin', { defaultValue: 'Вход администратора' })}
          </Link>
          {!isDesktop ? (
            <span className="text-xs text-amber-700">
              {t('cashierLogin.desktopHint', { defaultValue: 'Рекомендуется вход через программу кассы' })}
            </span>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{t('cashierLogin.title', { defaultValue: 'Вход кассира' })}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('cashierLogin.subtitle', { defaultValue: 'Введите PIN-код' })}</p>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <div className="text-xs font-semibold text-slate-500">
              {t('login.companyCode', { defaultValue: 'Код компании' })}
            </div>
            <div className="mt-1 font-mono text-sm tracking-wider text-slate-900">
              {companyCode || '—'}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-center font-mono text-2xl tracking-[0.45em] text-slate-900">
              {Array.from({ length: Math.max(PIN_MIN, dots.length) }).map((_, i) => (dots[i] ? '•' : '○')).join(' ')}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => pressDigit(n)}
                disabled={loading}
                className="h-14 rounded-xl border border-slate-200 bg-white text-xl font-semibold text-slate-900 shadow-sm active:scale-[0.98] disabled:opacity-60"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={clear}
              disabled={loading}
              className="h-14 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm active:scale-[0.98] disabled:opacity-60"
            >
              {t('common.cancel', { defaultValue: 'Очистить' })}
            </button>
            <button
              type="button"
              onClick={() => pressDigit(0)}
              disabled={loading}
              className="h-14 rounded-xl border border-slate-200 bg-white text-xl font-semibold text-slate-900 shadow-sm active:scale-[0.98] disabled:opacity-60"
            >
              0
            </button>
            <button
              type="button"
              onClick={backspace}
              disabled={loading}
              className="h-14 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm active:scale-[0.98] disabled:opacity-60"
            >
              {t('common.back', { defaultValue: '←' })}
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : null}
            {t('login.signIn', { defaultValue: 'Войти' })}
          </button>
        </div>
      </div>
    </div>
  );
}


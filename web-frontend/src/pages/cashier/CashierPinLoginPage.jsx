import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import BrandMark from '../../components/shared/BrandMark';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { adminLoginPath } from '../../utils/authLogin';
import '../../styles/cashier-pin-login.css';

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
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  const [pin, setPin] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    if (user?.role === 'CASHIER') navigate('/cashier/pos', { replace: true });
  }, [hasHydrated, token, user, navigate]);

  useEffect(() => {
    const fromUrl = searchParams.get('companyLoginCode');
    if (fromUrl) {
      setCompanyCode(String(fromUrl).trim().toUpperCase());
      return;
    }
    if (window.desktopCashier?.getCompanyLoginCode) {
      window.desktopCashier
        .getCompanyLoginCode()
        .then((c) => {
          if (c) setCompanyCode(String(c).trim().toUpperCase());
        })
        .catch(() => {});
      return;
    }
    try {
      const stored = localStorage.getItem('pos.companyLoginCode');
      if (stored) setCompanyCode(String(stored).trim().toUpperCase());
    } catch {
      /* ignore */
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
    <div className="cashier-pin-login">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <BrandMark size={32} iconClassName="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{displayAppName()}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {t('cashierLogin.subtitle', { defaultValue: 'Введите PIN-код' })}
          </p>
        </div>

        <div className="cashier-pin-login__card">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="cashier-pin-login__dots">
              {Array.from({ length: Math.max(PIN_MIN, dots.length) }).map((_, i) =>
                dots[i] ? '•' : '○'
              ).join(' ')}
            </div>
          </div>

          <div className="cashier-pin-login__keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => pressDigit(n)}
                disabled={loading}
                className="cashier-pin-login__key"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={clear}
              disabled={loading}
              className="cashier-pin-login__key cashier-pin-login__key--action"
            >
              {t('common.cancel', { defaultValue: 'Очистить' })}
            </button>
            <button
              type="button"
              onClick={() => pressDigit(0)}
              disabled={loading}
              className="cashier-pin-login__key"
            >
              0
            </button>
            <button
              type="button"
              onClick={backspace}
              disabled={loading}
              className="cashier-pin-login__key cashier-pin-login__key--action"
            >
              {t('common.back', { defaultValue: '←' })}
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className="cashier-pin-login__submit flex items-center justify-center gap-2"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : null}
            {t('login.signIn', { defaultValue: 'Войти' })}
          </button>
        </div>

        <Link to={adminLoginPath()} className="cashier-pin-login__admin-link">
          {t('cashierLogin.adminLogin', { defaultValue: 'Вход администратора' })}
        </Link>

        <p className="mt-4 text-center text-xs text-slate-500">
          {t('login.footer', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}

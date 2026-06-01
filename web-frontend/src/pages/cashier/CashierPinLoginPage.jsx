import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import BrandMark from '../../components/shared/BrandMark';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { adminLoginPath, resolveCashierCompanyCode, persistCompanyLoginCode, cashierSessionMatchesCompany } from '../../utils/authLogin';
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
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  const [pin, setPin] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !token || user?.role !== 'CASHIER') return;

    let cancelled = false;
    (async () => {
      const expectedCode = await resolveCashierCompanyCode(searchParams);
      if (cancelled) return;
      if (!cashierSessionMatchesCompany(user, expectedCode)) {
        logout();
        setPin('');
        toast.error(t('cashierLogin.companyChanged', {
          defaultValue: 'Код компании изменён — войдите с PIN снова',
        }));
        return;
      }
      navigate('/cashier/pos', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, token, user, navigate, logout, searchParams, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const code = await resolveCashierCompanyCode(searchParams);
      if (!cancelled && code) setCompanyCode(code);
    })();
    return () => {
      cancelled = true;
    };
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
      persistCompanyLoginCode(companyCode.trim().toUpperCase());
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
  const dotCount = Math.max(PIN_MIN, dots.length);

  return (
    <div className="cashier-pin-login">
      <div className="cashier-pin-login__shell">
        <header className="cashier-pin-login__header">
          <div className="cashier-pin-login__logo">
            <BrandMark size={32} iconClassName="text-white" />
          </div>
          <h1 className="cashier-pin-login__title">{displayAppName()}</h1>
          <p className="cashier-pin-login__subtitle">
            {t('cashierLogin.subtitle', { defaultValue: 'Введите PIN-код' })}
          </p>
        </header>

        <div className="cashier-pin-login__card">
          <div className="cashier-pin-login__pin-display">
            <div className="cashier-pin-login__dots" aria-label={t('cashierLogin.subtitle', { defaultValue: 'Введите PIN-код' })}>
              {Array.from({ length: dotCount }).map((_, i) => (
                <span
                  key={i}
                  className={`cashier-pin-login__dot${dots[i] ? ' is-filled' : ''}`}
                >
                  {dots[i] ? '•' : '○'}
                </span>
              ))}
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
            className="cashier-pin-login__submit"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : null}
            {t('login.signIn', { defaultValue: 'Войти' })}
          </button>
        </div>

        <footer className="cashier-pin-login__footer">
          <Link to={adminLoginPath()} className="cashier-pin-login__admin-link">
            {t('cashierLogin.adminLogin', { defaultValue: 'Вход администратора' })}
          </Link>
          <p className="cashier-pin-login__copyright">
            {t('login.footer', { year: new Date().getFullYear() })}
          </p>
        </footer>
      </div>
    </div>
  );
}

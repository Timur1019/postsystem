import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../../services/api';
import { useCashierLock } from '../../../contexts/CashierLockContext';
import { useAuthStore } from '../../../store/authStore';
import { useCashierTouchLayout } from '../../../hooks/useCashierTouchLayout';
import '../../../styles/cashier/pin-login.css';

const PIN_MAX = 6;

function normalizePin(s) {
  return String(s || '').replace(/\D/g, '').slice(0, PIN_MAX);
}

export default function CashierLockOverlay() {
  const { t } = useTranslation();
  const { locked, unlock } = useCashierLock();
  const user = useAuthStore((s) => s.user);
  const isCashier = user?.role === 'CASHIER';
  const touchLayout = useCashierTouchLayout();
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!locked) return null;

  const submitPin = async (pinValue) => {
    const pin = normalizePin(pinValue);
    if (pin.length < 4) return;
    setSubmitting(true);
    try {
      await authApi.verifyPin({ pin });
      setSecret('');
      unlock();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('pos.lockWrongPin', { defaultValue: 'Неверный PIN' }));
      setSecret('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCashier) {
      await submitPin(secret);
      return;
    }
    if (!secret.trim()) return;
    setSubmitting(true);
    try {
      await authApi.verifyPassword({ password: secret });
      setSecret('');
      unlock();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('pos.lockWrongPassword'));
    } finally {
      setSubmitting(false);
    }
  };

  const pressDigit = (d) => {
    if (submitting) return;
    const next = normalizePin(secret + String(d));
    setSecret(next);
    if (next.length >= 4) {
      submitPin(next);
    }
  };

  const backspace = () => {
    if (submitting) return;
    setSecret((s) => normalizePin(s).slice(0, -1));
  };

  const clear = () => {
    if (submitting) return;
    setSecret('');
  };

  const pinDigits = normalizePin(secret);
  const pinDotCount = Math.max(4, pinDigits.length);

  return (
    <div className="cashier-lock-overlay" role="dialog" aria-modal="true" aria-labelledby="cashier-lock-title">
      <div className="cashier-lock-overlay__backdrop" aria-hidden />
      <form
        className={`cashier-lock-overlay__card${isCashier ? ' cashier-lock-overlay__card--pin-touch' : ''}${touchLayout ? ' cashier-lock-overlay__card--touch' : ''}`}
        onSubmit={handleSubmit}
      >
        <Lock size={32} className="cashier-lock-overlay__icon" aria-hidden />
        <h2 id="cashier-lock-title" className="cashier-lock-overlay__title">
          {t('pos.lockTitle')}
        </h2>
        <p className="cashier-lock-overlay__hint">{t('pos.lockHint')}</p>

        {isCashier ? (
          <>
            <div className="cashier-pin-login__pin-display cashier-lock-overlay__pin-display">
              <div
                className="cashier-pin-login__dots"
                aria-label={t('pos.lockPinPh', { defaultValue: 'PIN' })}
              >
                {Array.from({ length: pinDotCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`cashier-pin-login__dot${pinDigits[i] ? ' is-filled' : ''}`}
                  >
                    {pinDigits[i] ? '•' : '○'}
                  </span>
                ))}
              </div>
            </div>
            <input
              type="password"
              className="visually-hidden"
              tabIndex={-1}
              aria-hidden
              value={secret}
              readOnly
              autoComplete="off"
            />
            <div className="cashier-pin-login__keypad cashier-lock-overlay__keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => pressDigit(n)}
                  disabled={submitting}
                  className="cashier-pin-login__key"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={clear}
                disabled={submitting}
                className="cashier-pin-login__key cashier-pin-login__key--action"
              >
                {t('common.cancel', { defaultValue: 'Очистить' })}
              </button>
              <button
                type="button"
                onClick={() => pressDigit(0)}
                disabled={submitting}
                className="cashier-pin-login__key"
              >
                0
              </button>
              <button
                type="button"
                onClick={backspace}
                disabled={submitting}
                className="cashier-pin-login__key cashier-pin-login__key--action"
              >
                {t('common.back', { defaultValue: '←' })}
              </button>
            </div>
            <button
              type="button"
              className="cashier-pin-login__submit w-100"
              disabled={submitting || pinDigits.length < 4}
              onClick={() => submitPin(secret)}
            >
              {submitting ? <Loader size={18} className="animate-spin" aria-hidden /> : null}
              {t('pos.lockUnlock')}
            </button>
          </>
        ) : (
          <>
            <input
              type="password"
              className="form-control cashier-lock-overlay__input"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={t('pos.lockPasswordPh')}
              autoComplete="current-password"
              autoFocus
              disabled={submitting}
            />
            <button type="submit" className="btn btn-success w-100" disabled={submitting || !secret.trim()}>
              {submitting ? <Loader size={18} className="animate-spin" aria-hidden /> : null}
              {t('pos.lockUnlock')}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

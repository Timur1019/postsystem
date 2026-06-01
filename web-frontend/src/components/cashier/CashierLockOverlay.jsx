import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import { useCashierLock } from '../../contexts/CashierLockContext';
import { useAuthStore } from '../../store/authStore';

export default function CashierLockOverlay() {
  const { t } = useTranslation();
  const { locked, unlock } = useCashierLock();
  const user = useAuthStore((s) => s.user);
  const isCashier = user?.role === 'CASHIER';
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!locked) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setSubmitting(true);
    try {
      if (isCashier) {
        await authApi.verifyPin({ pin: secret });
      } else {
        await authApi.verifyPassword({ password: secret });
      }
      setSecret('');
      unlock();
    } catch (err) {
      toast.error(err.response?.data?.message ?? (isCashier ? t('pos.lockWrongPin', { defaultValue: 'Неверный PIN' }) : t('pos.lockWrongPassword')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cashier-lock-overlay" role="dialog" aria-modal="true" aria-labelledby="cashier-lock-title">
      <div className="cashier-lock-overlay__backdrop" aria-hidden />
      <form className="cashier-lock-overlay__card" onSubmit={handleSubmit}>
        <Lock size={32} className="cashier-lock-overlay__icon" aria-hidden />
        <h2 id="cashier-lock-title" className="cashier-lock-overlay__title">
          {t('pos.lockTitle')}
        </h2>
        <p className="cashier-lock-overlay__hint">{t('pos.lockHint')}</p>
        <input
          type={isCashier ? 'tel' : 'password'}
          className="form-control cashier-lock-overlay__input"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={isCashier ? t('pos.lockPinPh', { defaultValue: 'PIN' }) : t('pos.lockPasswordPh')}
          autoComplete={isCashier ? 'one-time-code' : 'current-password'}
          inputMode={isCashier ? 'numeric' : undefined}
          autoFocus
          disabled={submitting}
        />
        <button type="submit" className="btn btn-success w-100" disabled={submitting || !secret.trim()}>
          {submitting ? <Loader size={18} className="animate-spin" aria-hidden /> : null}
          {t('pos.lockUnlock')}
        </button>
      </form>
    </div>
  );
}

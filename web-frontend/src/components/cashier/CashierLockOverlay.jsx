import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import { useCashierLock } from '../../contexts/CashierLockContext';

export default function CashierLockOverlay() {
  const { t } = useTranslation();
  const { locked, unlock } = useCashierLock();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!locked) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    try {
      await authApi.verifyPassword({ password });
      setPassword('');
      unlock();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('pos.lockWrongPassword'));
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
          type="password"
          className="form-control cashier-lock-overlay__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('pos.lockPasswordPh')}
          autoComplete="current-password"
          autoFocus
          disabled={submitting}
        />
        <button type="submit" className="btn btn-success w-100" disabled={submitting || !password.trim()}>
          {submitting ? <Loader size={18} className="animate-spin" aria-hidden /> : null}
          {t('pos.lockUnlock')}
        </button>
      </form>
    </div>
  );
}

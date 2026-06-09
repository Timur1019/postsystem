import { Loader } from 'lucide-react';

export default function CashierPinLoginKeypad({
  t,
  dots,
  dotCount,
  loading,
  canSubmit,
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
}) {
  return (
    <div className="cashier-pin-login__card">
      <div className="cashier-pin-login__pin-display">
        <div
          className="cashier-pin-login__dots"
          aria-label={t('cashierLogin.subtitle', { defaultValue: 'Введите PIN-код' })}
        >
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
            onClick={() => onDigit(n)}
            disabled={loading}
            className="cashier-pin-login__key"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          disabled={loading}
          className="cashier-pin-login__key cashier-pin-login__key--action"
        >
          {t('common.cancel', { defaultValue: 'Очистить' })}
        </button>
        <button
          type="button"
          onClick={() => onDigit(0)}
          disabled={loading}
          className="cashier-pin-login__key"
        >
          0
        </button>
        <button
          type="button"
          onClick={onBackspace}
          disabled={loading}
          className="cashier-pin-login__key cashier-pin-login__key--action"
        >
          {t('common.back', { defaultValue: '←' })}
        </button>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || loading}
        className="cashier-pin-login__submit"
      >
        {loading ? <Loader size={18} className="animate-spin" /> : null}
        {t('login.signIn', { defaultValue: 'Войти' })}
      </button>
    </div>
  );
}

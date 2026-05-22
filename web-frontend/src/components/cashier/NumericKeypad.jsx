// src/components/cashier/NumericKeypad.jsx
import { Delete, Eraser } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtInteger } from '../../utils/formatMoney';

export const formatKeypadAmount = (raw) => {
  if (!raw) return '0';
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return fmtInteger(n);
};

export function appendKeypadDigit(current, digit) {
  const d = String(digit);
  if (!/^\d$/.test(d)) return current;
  const base = current === '0' ? '' : current;
  const next = `${base}${d}`.replace(/^0+/, '') || '0';
  return next.length > 12 ? current : next;
}

const toAmountString = (amount) => {
  const n = Number(amount);
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

export default function NumericKeypad({
  value,
  onChange,
  exactAmount,
  quickActions,
  disabled = false,
}) {
  const { t } = useTranslation();
  const hasQuickRow = quickActions && quickActions.length > 0;

  const press = (digit) => {
    if (disabled) return;
    onChange(appendKeypadDigit(value, digit));
  };

  const backspace = () => {
    if (disabled || !value) return;
    onChange(value.slice(0, -1));
  };

  const clear = () => {
    if (disabled) return;
    onChange('');
  };

  const setExact = () => {
    if (disabled || exactAmount == null) return;
    onChange(toAmountString(exactAmount));
  };

  const applyQuick = (amount, mode = 'set') => {
    if (disabled || amount == null) return;
    if (mode === 'add') {
      const cur = Number(String(value).replace(',', '.')) || 0;
      const next = Math.round((cur + Number(amount)) * 100) / 100;
      onChange(toAmountString(next));
      return;
    }
    onChange(toAmountString(amount));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="pos-keypad">
      {hasQuickRow && (
        <div className="pos-keypad__quick">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="pos-keypad__quick-btn"
              disabled={disabled}
              onClick={() => applyQuick(action.amount, action.mode)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <div className="pos-keypad__grid">
        {keys.map((digit) => (
          <button
            key={digit}
            type="button"
            className="pos-keypad__key"
            disabled={disabled}
            onClick={() => press(digit)}
          >
            {digit}
          </button>
        ))}
        {!hasQuickRow ? (
          <button
            type="button"
            className="pos-keypad__key pos-keypad__key--action"
            disabled={disabled}
            onClick={setExact}
          >
            {t('pos.keypadExact')}
          </button>
        ) : (
          <button
            type="button"
            className="pos-keypad__key pos-keypad__key--action"
            disabled={disabled}
            onClick={clear}
          >
            {t('pos.keypadClear')}
          </button>
        )}
        <button
          type="button"
          className="pos-keypad__key"
          disabled={disabled}
          onClick={() => press('0')}
        >
          0
        </button>
        <button
          type="button"
          className="pos-keypad__key pos-keypad__key--icon"
          disabled={disabled}
          onClick={backspace}
          aria-label={t('pos.keypadBackspace')}
        >
          <Delete size={22} strokeWidth={2} />
        </button>
      </div>
      {!hasQuickRow && (
        <button type="button" className="pos-keypad__clear" disabled={disabled} onClick={clear}>
          <Eraser size={16} strokeWidth={2} />
          {t('pos.keypadClear')}
        </button>
      )}
    </div>
  );
}

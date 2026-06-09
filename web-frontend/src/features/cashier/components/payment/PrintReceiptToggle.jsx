import { Printer } from 'lucide-react';

export default function PrintReceiptToggle({ checked, onChange, t }) {
  const fullLabel = t('pos.printReceiptAfterSale');
  return (
    <label
      className="pos-pay-print-toggle pos-pay-print-toggle--footer"
      title={fullLabel}
    >
      <input
        type="checkbox"
        className="pos-pay-print-toggle__input"
        checked={checked}
        onChange={onChange}
        aria-label={fullLabel}
      />
      <span className="pos-pay-print-toggle__box" aria-hidden />
      <Printer size={18} strokeWidth={1.75} className="pos-pay-print-toggle__icon" aria-hidden />
      <span className="pos-pay-print-toggle__text">{t('pos.printReceiptShort')}</span>
    </label>
  );
}

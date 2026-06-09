import { ArrowRight } from 'lucide-react';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { PAY_METHODS } from './posPaymentConstants';

export default function PosPaymentMethodStep({ t, toPay, handleMethod }) {
  return (
    <div className="pos-pay-panel__step">
      <div className="pos-pay-method-step__hero">
        <h3 className="pos-pay-method-step__title">{t('pos.choosePaymentMethod')}</h3>
        <div className="pos-pay-method-step__due">
          <span className="pos-pay-method-step__due-label">{t('pos.amountToPay')}</span>
          <span className="pos-pay-method-step__due-value">{fmt(toPay)}</span>
        </div>
      </div>
      <div className="pos-pay-method-cards pos-pay-method-cards--register-stack pos-pay-method-cards--terminal">
        {PAY_METHODS.map(({ id, icon: Icon, labelKey, action }) => (
          <button
            key={id}
            type="button"
            className="pos-pay-method-card pos-pay-method-card--register"
            onClick={() => handleMethod(action)}
          >
            <span className="pos-pay-method-card__icon">
              <Icon size={22} strokeWidth={1.5} />
            </span>
            <span className="pos-pay-method-card__label">{t(labelKey)}</span>
            <ArrowRight size={18} className="pos-pay-method-card__arrow" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

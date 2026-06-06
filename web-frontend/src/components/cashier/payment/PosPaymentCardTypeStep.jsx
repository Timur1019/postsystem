import { ArrowRight } from 'lucide-react';
import { CARD_TYPES } from './posPaymentConstants';

export default function PosPaymentCardTypeStep({ t, isPending, submitCard }) {
  return (
    <div className="pos-pay-panel__step pos-pay-panel__step--card-type">
      <p className="pos-pay-card-type-step__lead">{t('pos.cardTypeLead')}</p>
      <div className="pos-pay-card-types pos-pay-card-types--register-stack">
        {CARD_TYPES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              className="pos-pay-card-type pos-pay-card-type--register"
              disabled={isPending}
              onClick={() => submitCard(c.id)}
            >
              <span className="pos-pay-card-type__icon">
                <Icon size={22} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="pos-pay-card-type__label">{t(c.labelKey)}</span>
              <ArrowRight size={18} className="pos-pay-card-type__arrow" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}

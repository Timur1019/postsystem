import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export default function PosPaymentMixedCardStep({ t, cashPartNum, cardRemainder }) {
  return (
    <div className="pos-pay-panel__step">
      <div className="pos-pay-mixed-summary">
        <div className="pos-pay-mixed-summary__row">
          <span>{t('pos.mixedPaidCash')}</span>
          <strong>{fmt(cashPartNum)}</strong>
        </div>
        <div className="pos-pay-mixed-summary__row pos-pay-mixed-summary__row--total">
          <span>{t('pos.mixedCardPart')}</span>
          <strong>{fmt(cardRemainder)}</strong>
        </div>
      </div>
    </div>
  );
}

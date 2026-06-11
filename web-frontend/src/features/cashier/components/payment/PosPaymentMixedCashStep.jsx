import NumericKeypad, { formatKeypadAmount } from '../NumericKeypad';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export default function PosPaymentMixedCashStep({
  t,
  toPay,
  cashPortion,
  setCashPortion,
  cardRemainder,
  mixedDistributed,
  mixedPercent,
  cashExceeds,
  mixedQuickActions,
  handleCashPortionChange,
  isPending,
}) {
  return (
    <div className="pos-pay-panel__step">
      <div className="pos-pay-mixed-cards pos-pay-mixed-cards--stack">
        <div className="pos-pay-amount-box pos-pay-amount-box--active">
          <div className="pos-pay-amount-box__head">
            <span className="pos-pay-amount-box__label">{t('pos.payCash')}</span>
            <button type="button" className="pos-pay-amount-box__action" onClick={() => setCashPortion('')}>
              {t('pos.keypadClear')}
            </button>
          </div>
          <p className="pos-pay-amount-box__value">
            {formatKeypadAmount(cashPortion)}
            <span className="pos-pay-amount-box__currency">сум</span>
          </p>
        </div>
        <div className={`pos-pay-amount-box${cardRemainder > 0 ? '' : ' is-dimmed'}`}>
          <div className="pos-pay-amount-box__head">
            <span className="pos-pay-amount-box__label">{t('pos.payCard')}</span>
            <button type="button" className="pos-pay-amount-box__action" onClick={() => setCashPortion('0')}>
              {t('pos.mixedCardRemainder')}
            </button>
          </div>
          <p className="pos-pay-amount-box__value">
            {fmt(cardRemainder)}
            <span className="pos-pay-amount-box__currency">сум</span>
          </p>
        </div>
      </div>
      <div className="pos-pay-mixed-progress">
        <div className="pos-pay-mixed-progress__meta">
          <span>
            {t('pos.mixedDistributed')}: {fmt(mixedDistributed)} / {fmt(toPay)}
          </span>
          <span>{mixedPercent}%</span>
        </div>
        <div className="pos-pay-mixed-progress__bar">
          <div className="pos-pay-mixed-progress__fill" style={{ '--mixed-progress': `${mixedPercent}%` }} />
        </div>
      </div>
      {cashExceeds && <p className="pos-pay-panel__error">{t('pos.mixedCashExceeds')}</p>}
      <NumericKeypad
        value={cashPortion}
        onChange={handleCashPortionChange}
        quickActions={mixedQuickActions}
        disabled={isPending}
      />
    </div>
  );
}

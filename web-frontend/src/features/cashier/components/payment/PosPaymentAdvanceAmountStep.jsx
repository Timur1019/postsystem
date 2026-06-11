import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { amountStr } from './posPaymentConstants';

export default function PosPaymentAdvanceAmountStep({
  t,
  toPay,
  balance,
  advanceAmount,
  setAdvanceAmount,
  customerName,
}) {
  const maxAdvance = Math.min(Number(balance) || 0, toPay);
  const used = Number(advanceAmount) || 0;
  const remainder = Math.max(0, toPay - used);

  return (
    <div className="pos-pay-panel__step">
      <div className="pos-pay-method-step__hero">
        <h3 className="pos-pay-method-step__title">{t('pos.advanceAmountTitle')}</h3>
        <p className="pos-pay-advance-step__customer">{customerName}</p>
        <div className="pos-pay-advance-step__balance">
          <span>{t('pos.advanceAvailable')}</span>
          <strong>{fmt(balance)}</strong>
        </div>
      </div>
      <label className="pos-pay-advance-step__field">
        <span>{t('pos.advanceUseAmount')}</span>
        <input
          type="number"
          min="0"
          max={maxAdvance}
          step="0.01"
          value={advanceAmount}
          onChange={(e) => setAdvanceAmount(e.target.value)}
        />
      </label>
      <div className="pos-pay-advance-step__quick">
        <button type="button" onClick={() => setAdvanceAmount(amountStr(maxAdvance))}>
          {t('pos.advanceUseMax')}
        </button>
        <button type="button" onClick={() => setAdvanceAmount(amountStr(toPay))}>
          {t('pos.advanceUseFullCheck')}
        </button>
      </div>
      {remainder > 0.001 ? (
        <p className="pos-pay-advance-step__remainder">
          {t('pos.advanceRemainder', { amount: fmt(remainder) })}
        </p>
      ) : (
        <p className="pos-pay-advance-step__remainder pos-pay-advance-step__remainder--ok">
          {t('pos.advanceCoversFull')}
        </p>
      )}
    </div>
  );
}

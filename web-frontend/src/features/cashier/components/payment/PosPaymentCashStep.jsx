import NumericKeypad, { formatKeypadAmount } from '../NumericKeypad';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export default function PosPaymentCashStep({
  t,
  toPay,
  tendered,
  setTendered,
  changeDue,
  cashPaidEnough,
  cashShortfall,
  isPending,
}) {
  return (
    <div className="pos-pay-panel__step">
      <div className="pos-pay-cash-panel pos-pay-cash-panel--terminal">
        <div className="pos-pay-cash__summary-row">
          <span>{t('pos.amountToPay')}</span>
          <strong>{fmt(toPay)}</strong>
        </div>
        <p className="pos-pay-cash__hint">{t('pos.cashTenderHint')}</p>
        <div className="pos-pay-cash__received-box" aria-live="polite">
          <span className="pos-pay-cash__received-label">{t('pos.receivedLabel')}</span>
          <span className="pos-pay-cash__received-value">{formatKeypadAmount(tendered)}</span>
        </div>
        <div
          className={`pos-pay-cash__change-row${cashPaidEnough ? ' pos-pay-cash__change-row--ready' : ''}`}
          aria-live="polite"
        >
          <span>{t('pos.change')}</span>
          <strong>{fmt(changeDue)}</strong>
        </div>
        {cashShortfall > 0 ? (
          <p className="pos-pay-cash__shortfall" role="status">
            {t('pos.cashShortfall', { amount: fmt(cashShortfall) })}
          </p>
        ) : null}
      </div>
      <NumericKeypad
        value={tendered}
        onChange={setTendered}
        hideActionKey
        hideBottomClear
        exactAmount={toPay}
        disabled={isPending}
      />
    </div>
  );
}

import { Check } from 'lucide-react';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { isDeferredReceiptType, RECEIPT_TYPES } from './posPaymentConstants';

export default function PosPaymentReceiptStep({ t, receiptType, selectReceiptType, toPay }) {
  const deferredReceipt = isDeferredReceiptType(receiptType);

  return (
    <div className="pos-pay-panel__step">
      <div className="pos-pay-receipt-types pos-pay-receipt-types--register-stack">
        {RECEIPT_TYPES.map(({ id, icon: Icon }) => {
          const active = receiptType === id;
          return (
            <button
              key={id}
              type="button"
              className={`pos-pay-receipt-type pos-pay-receipt-type--register${active ? ' is-active' : ''}`}
              onClick={() => selectReceiptType(id)}
            >
              <span className="pos-pay-receipt-type__icon-wrap">
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <span className="pos-pay-receipt-type__label">{t(`pos.receiptType.${id}`)}</span>
              {active ? (
                <Check size={20} strokeWidth={2.5} className="pos-pay-receipt-type__check" />
              ) : null}
            </button>
          );
        })}
      </div>
      {deferredReceipt ? (
        <div className="pos-pay-deferred-summary">
          <p className="pos-pay-deferred-summary__hint">
            {receiptType === 'ADVANCE'
              ? t('pos.deferredSaleHintAdvance')
              : t('pos.deferredSaleHintCredit')}
          </p>
          <div className="pos-pay-deferred-summary__amount">
            <span className="pos-pay-deferred-summary__label">{t('pos.amountToPay')}</span>
            <strong className="pos-pay-deferred-summary__value">{fmt(toPay)}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// src/components/cashier/PosPaymentFlow.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader, CreditCard, Coins, Wallet, Banknote } from 'lucide-react';
import NumericKeypad, { formatKeypadAmount } from './NumericKeypad';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

const RECEIPT_TYPES = [
  { id: 'SALE', icon: CreditCard },
  { id: 'ADVANCE', icon: Coins },
  { id: 'CREDIT', icon: Wallet },
];

const CARD_TYPES = [
  { id: 'PERSONAL', labelKey: 'pos.cardPersonal' },
  { id: 'CORPORATE', labelKey: 'pos.cardCorporate' },
  { id: 'SOCIAL', labelKey: 'pos.cardSocial' },
];

export default function PosPaymentFlow({ open, onClose, total, onConfirm, isPending }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('receipt');
  const [receiptType, setReceiptType] = useState('SALE');
  const [payMethod, setPayMethod] = useState(null);
  const [cardType, setCardType] = useState(null);
  const [tendered, setTendered] = useState('');

  if (!open) return null;

  const reset = () => {
    setStep('receipt');
    setReceiptType('SALE');
    setPayMethod(null);
    setCardType(null);
    setTendered('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const discount = 0;
  const toPay = total;

  const submitCard = (type) => {
    setCardType(type);
    onConfirm({
      paymentMethod: 'CARD',
      receiptType,
      cardType: type,
      amountTendered: toPay,
    });
  };

  const submitCash = () => {
    const amount = Number(tendered) || 0;
    if (amount < toPay) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType,
      cardType: null,
      amountTendered: amount,
    });
  };

  return (
    <div className="pos-pay-overlay">
      <div className={`pos-pay-modal${step === 'cash' ? ' pos-pay-modal--cash' : ''}`}>
        <button type="button" className="pos-pay-modal__close" onClick={handleClose} aria-label={t('common.close')}>
          <X size={20} />
        </button>

        {step === 'receipt' && (
          <>
            <h2 className="pos-pay-modal__title">{t('pos.receiptTypeTitle')}</h2>
            <div className="pos-pay-receipt-types">
              {RECEIPT_TYPES.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`pos-pay-receipt-type ${receiptType === id ? 'pos-pay-receipt-type--active' : ''}`}
                  onClick={() => setReceiptType(id)}
                >
                  <Icon size={28} />
                  <span>{t(`pos.receiptType.${id}`)}</span>
                </button>
              ))}
            </div>
            <div className="pos-pay-summary">
              <div className="pos-pay-summary__row">
                <span>{t('pos.summaryTotal')}</span>
                <span>{fmt(toPay)} сум</span>
              </div>
              <div className="pos-pay-summary__row">
                <span>{t('pos.summaryDiscount')}</span>
                <span>{fmt(discount)} сум</span>
              </div>
              <div className="pos-pay-summary__row pos-pay-summary__row--bold">
                <span>{t('pos.summaryToPay')}</span>
                <span>{fmt(toPay)} сум</span>
              </div>
            </div>
            <button type="button" className="pos-pay-submit" onClick={() => setStep('method')}>
              {t('pos.continuePay')}
            </button>
          </>
        )}

        {step === 'method' && (
          <>
            <h2 className="pos-pay-modal__title">{t('pos.paymentTitle')}</h2>
            <p className="pos-pay-modal__amount">{fmt(toPay)} сум</p>
            <div className="pos-pay-methods">
              <button
                type="button"
                className="pos-pay-method"
                onClick={() => {
                  setTendered('');
                  setStep('cash');
                }}
              >
                <Banknote size={24} />
                {t('pos.payCash')}
              </button>
              <button type="button" className="pos-pay-method" onClick={() => setStep('cardType')}>
                <CreditCard size={24} />
                {t('pos.payCard')}
              </button>
              <button type="button" className="pos-pay-method pos-pay-method--alt" onClick={() => setStep('cardType')}>
                <Wallet size={24} />
                {t('pos.payOther')}
              </button>
            </div>
            <button type="button" className="pos-pay-back" onClick={() => setStep('receipt')}>
              {t('common.back')}
            </button>
          </>
        )}

        {step === 'cardType' && (
          <>
            <h2 className="pos-pay-modal__title">{t('pos.cardTypeTitle')}</h2>
            <p className="pos-pay-modal__amount">{fmt(toPay)} сум</p>
            <div className="pos-pay-card-types">
              {CARD_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="pos-pay-card-type"
                  disabled={isPending}
                  onClick={() => submitCard(c.id)}
                >
                  <CreditCard size={32} className="text-teal-600" />
                  <span>{t(c.labelKey)}</span>
                </button>
              ))}
            </div>
            <button type="button" className="pos-pay-back" onClick={() => setStep('method')}>
              {t('common.back')}
            </button>
          </>
        )}

        {step === 'cash' && (
          <>
            <h2 className="pos-pay-modal__title">{t('pos.payCash')}</h2>
            <div className="pos-pay-cash">
              <p className="pos-pay-cash__due">
                <span className="pos-pay-cash__due-label">{t('pos.summaryToPay')}</span>
                <span className="pos-pay-cash__due-value">{fmt(toPay)} сум</span>
              </p>

              <label className="pos-pay-cash-label">{t('pos.amountTendered')}</label>
              <div
                className={`pos-pay-cash__display${
                  tendered && Number(tendered) >= toPay ? ' pos-pay-cash__display--ok' : ''
                }`}
                aria-live="polite"
              >
                {formatKeypadAmount(tendered)}
                <span className="pos-pay-cash__currency">сум</span>
              </div>

              <NumericKeypad
                value={tendered}
                onChange={setTendered}
                exactAmount={toPay}
                disabled={isPending}
              />

              {tendered && Number(tendered) >= toPay && (
                <p className="pos-pay-change">
                  {t('pos.change')}: <strong>{fmt(Number(tendered) - toPay)} сум</strong>
                </p>
              )}

              <button
                type="button"
                className="pos-pay-submit"
                disabled={isPending || !tendered || Number(tendered) < toPay}
                onClick={submitCash}
              >
                {isPending ? <Loader size={18} className="animate-spin" /> : null}
                {t('pos.completeSale')}
              </button>
            </div>
            <button
              type="button"
              className="pos-pay-back"
              onClick={() => {
                setTendered('');
                setStep('method');
              }}
            >
              {t('common.back')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

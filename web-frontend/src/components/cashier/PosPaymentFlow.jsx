// src/components/cashier/PosPaymentFlow.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader, CreditCard, Coins, Wallet, Banknote, Split } from 'lucide-react';
import NumericKeypad, { formatKeypadAmount } from './NumericKeypad';
import PosModalPortal from './PosModalPortal';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const amountStr = (n) => {
  const v = round2(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

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

const CASH_STEPS = new Set(['cash', 'mixedCash', 'mixedCard']);

function MixedStepBar({ step }) {
  const { t } = useTranslation();
  return (
    <div className="pos-pay-steps" aria-label={t('pos.mixedStepOf', { step })}>
      <span className={`pos-pay-steps__dot${step >= 1 ? ' pos-pay-steps__dot--active' : ''}`} />
      <span className={`pos-pay-steps__line${step >= 2 ? ' pos-pay-steps__line--active' : ''}`} />
      <span className={`pos-pay-steps__dot${step >= 2 ? ' pos-pay-steps__dot--active' : ''}`} />
      <span className="pos-pay-steps__label">{t('pos.mixedStepOf', { step })}</span>
    </div>
  );
}

export default function PosPaymentFlow({ open, onClose, total, discountTotal = 0, onConfirm, isPending }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('receipt');
  const [receiptType, setReceiptType] = useState('SALE');
  const [payMethod, setPayMethod] = useState(null);
  const [tendered, setTendered] = useState('');
  const [cashPortion, setCashPortion] = useState('');

  const reset = () => {
    setStep('receipt');
    setReceiptType('SALE');
    setPayMethod(null);
    setTendered('');
    setCashPortion('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const discount = discountTotal;
  const toPay = round2(total);

  const defaultTendered = (amount = toPay) => amountStr(amount);

  useEffect(() => {
    if (open && step === 'cash') {
      setTendered(defaultTendered());
    }
  }, [open, step, toPay]);

  const goToCash = () => {
    setPayMethod('cash');
    setTendered(defaultTendered());
    setStep('cash');
  };

  const goToMixed = () => {
    setPayMethod('mixed');
    setCashPortion('');
    setStep('mixedCash');
  };

  const cashPartNum = round2(cashPortion);
  const cardRemainder = round2(Math.max(0, toPay - cashPartNum));

  const mixedQuickActions = [
    { label: t('pos.mixedKeypadHalf'), amount: round2(toPay / 2) },
    { label: t('pos.mixedKeypadAll'), amount: toPay },
  ];

  const submitMixed = (type) => {
    const cash = cashPartNum;
    if (cash > toPay + 0.001) return;
    onConfirm({
      paymentMethod: 'MIXED',
      receiptType,
      cardType: cardRemainder > 0.001 ? type : null,
      cashAmount: cash,
      amountTendered: cash,
    });
  };

  const proceedFromMixedCash = () => {
    if (cashPartNum > toPay + 0.001) return;
    if (cardRemainder > 0.001) {
      setStep('mixedCard');
    } else {
      submitMixed(null);
    }
  };

  const proceedFromMixedCard = () => {
    if (cardRemainder > 0.001) {
      setStep('cardType');
    } else {
      submitMixed(null);
    }
  };

  const submitCard = (type) => {
    if (payMethod === 'mixed') {
      submitMixed(type);
      return;
    }
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

  const modalClass =
    step === 'cash' || CASH_STEPS.has(step) ? ' pos-pay-modal--cash' : '';

  return (
    <PosModalPortal open={open} onClose={handleClose}>
      <div className={`pos-pay-modal${modalClass}`} onMouseDown={(e) => e.stopPropagation()}>
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
              <button type="button" className="pos-pay-method" onClick={goToCash}>
                <Banknote size={24} />
                {t('pos.payCash')}
              </button>
              <button type="button" className="pos-pay-method" onClick={() => { setPayMethod('card'); setStep('cardType'); }}>
                <CreditCard size={24} />
                {t('pos.payCard')}
              </button>
              <button type="button" className="pos-pay-method pos-pay-method--alt" onClick={goToMixed}>
                <Split size={24} />
                {t('pos.payMixed')}
              </button>
            </div>
            <button type="button" className="pos-pay-back" onClick={() => setStep('receipt')}>
              {t('common.back')}
            </button>
          </>
        )}

        {step === 'mixedCash' && (
          <>
            <MixedStepBar step={1} />
            <h2 className="pos-pay-modal__title">{t('pos.mixedStepCashTitle')}</h2>
            <div className="pos-pay-cash">
              <p className="pos-pay-cash__due">
                <span className="pos-pay-cash__due-label">{t('pos.summaryToPay')}</span>
                <span className="pos-pay-cash__due-value">{fmt(toPay)} сум</span>
              </p>

              <label className="pos-pay-cash-label">{t('pos.mixedCashPart')}</label>
              <div
                className={`pos-pay-cash__display${
                  cashPortion && cashPartNum >= 0 ? ' pos-pay-cash__display--ok' : ''
                }`}
              >
                {formatKeypadAmount(cashPortion)}
                <span className="pos-pay-cash__currency">сум</span>
              </div>

              <NumericKeypad
                value={cashPortion}
                onChange={setCashPortion}
                quickActions={mixedQuickActions}
                disabled={isPending}
              />

              {cashPortion !== '' && (
                <p className="pos-pay-mixed-remainder">
                  {t('pos.mixedCardRemainder')}: <strong>{fmt(cardRemainder)} сум</strong>
                </p>
              )}

              <button
                type="button"
                className="pos-pay-submit"
                disabled={isPending || cashPartNum > toPay + 0.001}
                onClick={proceedFromMixedCash}
              >
                {isPending ? <Loader size={18} className="animate-spin" /> : null}
                {cardRemainder > 0.001 ? t('pos.continuePay') : t('pos.completeSale')}
              </button>
            </div>
            <button type="button" className="pos-pay-back" onClick={() => setStep('method')}>
              {t('common.back')}
            </button>
          </>
        )}

        {step === 'mixedCard' && (
          <>
            <MixedStepBar step={2} />
            <h2 className="pos-pay-modal__title">{t('pos.mixedStepCardTitle')}</h2>
            <div className="pos-pay-cash">
              <div className="pos-pay-mixed-summary">
                <div className="pos-pay-mixed-summary__row">
                  <span>{t('pos.mixedPaidCash')}</span>
                  <strong>{fmt(cashPartNum)} сум</strong>
                </div>
                <div className="pos-pay-mixed-summary__row pos-pay-mixed-summary__row--total">
                  <span>{t('pos.summaryToPay')}</span>
                  <strong>{fmt(toPay)} сум</strong>
                </div>
              </div>

              <p className="pos-pay-mixed-card-amount-label">{t('pos.mixedCardPart')}</p>
              <div className="pos-pay-cash__display pos-pay-cash__display--card pos-pay-cash__display--ok pos-pay-cash__display--readonly">
                {fmt(cardRemainder)}
                <span className="pos-pay-cash__currency">сум</span>
              </div>

              <button
                type="button"
                className="pos-pay-submit"
                disabled={isPending}
                onClick={proceedFromMixedCard}
              >
                {isPending ? <Loader size={18} className="animate-spin" /> : null}
                {t('pos.continuePay')}
              </button>
            </div>
            <button type="button" className="pos-pay-back" onClick={() => setStep('mixedCash')}>
              {t('common.back')}
            </button>
          </>
        )}

        {step === 'cardType' && (
          <>
            <h2 className="pos-pay-modal__title">{t('pos.cardTypeTitle')}</h2>
            <p className="pos-pay-modal__amount">
              {payMethod === 'mixed'
                ? `${fmt(cardRemainder)} ${t('pos.mixedCardPart')}`
                : `${fmt(toPay)} сум`}
            </p>
            {payMethod === 'mixed' && (
              <div className="pos-pay-mixed-summary pos-pay-mixed-summary--compact">
                <div className="pos-pay-mixed-summary__row">
                  <span>{t('pos.mixedPaidCash')}</span>
                  <span>{fmt(cashPartNum)} сум</span>
                </div>
                <div className="pos-pay-mixed-summary__row">
                  <span>{t('pos.mixedCardPart')}</span>
                  <span>{fmt(cardRemainder)} сум</span>
                </div>
              </div>
            )}
            <div className="pos-pay-card-types">
              {CARD_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="pos-pay-card-type"
                  disabled={isPending}
                  onClick={() => submitCard(c.id)}
                >
                  <CreditCard size={32} className="pos-pay-card-type__icon" />
                  <span>{t(c.labelKey)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pos-pay-back"
              onClick={() => setStep(payMethod === 'mixed' ? 'mixedCard' : 'method')}
            >
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
                disabled={isPending || Number(tendered) < toPay}
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
    </PosModalPortal>
  );
}

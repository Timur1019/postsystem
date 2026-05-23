// Оплата в правой колонке кассы (register rail).
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Loader,
  CreditCard,
  Coins,
  Wallet,
  Banknote,
  Split,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Heart,
} from 'lucide-react';
import NumericKeypad, { formatKeypadAmount } from './NumericKeypad';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import { clampPayAmount, exceedsPayAmount, round2 } from '../../utils/taxAmounts';

const amountStr = (n) => {
  const v = round2(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

const parseTenderedInput = (raw) =>
  round2(Number(String(raw ?? '').replace(/\s/g, '').replace(',', '.')) || 0);

const RECEIPT_TYPES = [
  { id: 'SALE', icon: CreditCard },
  { id: 'ADVANCE', icon: Coins },
  { id: 'CREDIT', icon: Wallet },
];

const CARD_TYPES = [
  { id: 'PERSONAL', labelKey: 'pos.cardPersonal', icon: CreditCard },
  { id: 'CORPORATE', labelKey: 'pos.cardCorporate', icon: Building2 },
  { id: 'SOCIAL', labelKey: 'pos.cardSocial', icon: Heart },
];

const PAY_METHODS = [
  { id: 'cash', icon: Banknote, labelKey: 'pos.payCash', action: 'cash' },
  { id: 'card', icon: CreditCard, labelKey: 'pos.payCard', action: 'card' },
  { id: 'mixed', icon: Split, labelKey: 'pos.payMixed', action: 'mixed' },
];

export default function PosPaymentFlow({
  open,
  onClose,
  total,
  onConfirm,
  isPending,
  className = '',
}) {
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

  const toPay = round2(total);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const goToCash = () => {
    setPayMethod('cash');
    setTendered('');
    setStep('cash');
  };

  const goToMixed = () => {
    setPayMethod('mixed');
    setCashPortion('');
    setStep('mixedCash');
  };

  const handleMethod = (action) => {
    if (action === 'cash') goToCash();
    else if (action === 'card') {
      setPayMethod('card');
      setStep('cardType');
    } else goToMixed();
  };

  const cashPartNum = round2(cashPortion);
  const cashExceeds = exceedsPayAmount(cashPartNum, toPay);
  const cardRemainder = round2(Math.max(0, toPay - cashPartNum));
  const mixedDistributed = round2(Math.min(cashPartNum, toPay));
  const mixedPercent = toPay > 0 ? Math.min(100, Math.round((mixedDistributed / toPay) * 100)) : 0;

  const handleCashPortionChange = useCallback(
    (next) => {
      if (next === '') {
        setCashPortion('');
        return;
      }
      const num = round2(next);
      const clamped = clampPayAmount(num, toPay);
      setCashPortion(amountStr(clamped));
    },
    [toPay]
  );

  const mixedQuickActions = [
    { label: t('pos.mixedKeypadHalf'), amount: round2(toPay / 2) },
    { label: t('pos.mixedKeypadAll'), amount: toPay },
  ];

  const tenderedNum = parseTenderedInput(tendered);
  const changeDue = round2(Math.max(0, tenderedNum - toPay));
  const cashPaidEnough = tenderedNum >= toPay && tenderedNum > 0;
  const cashShortfall = tenderedNum > 0 && tenderedNum < toPay ? round2(toPay - tenderedNum) : 0;

  const submitMixed = (type) => {
    if (isPending || cashExceeds) return;
    const cash = clampPayAmount(cashPartNum, toPay);
    const card = round2(Math.max(0, toPay - cash));
    if (cash <= 0 && card <= 0) return;
    onConfirm({
      paymentMethod: 'MIXED',
      receiptType,
      cardType: card > 0.001 ? type : null,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: cash,
    });
  };

  const proceedFromMixedCash = () => {
    if (isPending || cashExceeds) return;
    if (cashPartNum <= 0 && toPay > 0) {
      toast.error(t('pos.mixedCashRequired'));
      return;
    }
    if (cardRemainder > 0.001) setStep('mixedCard');
    else submitMixed(null);
  };

  const proceedFromMixedCard = () => {
    if (cardRemainder > 0.001) setStep('cardType');
    else submitMixed(null);
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
    const amount = parseTenderedInput(tendered);
    if (amount < toPay) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType,
      cardType: null,
      amountTendered: amount,
    });
  };

  const selectReceiptType = (id) => {
    setReceiptType(id);
    setStep('method');
  };

  let stepTitle = t('pos.receiptTypeTitle');
  if (step === 'method') stepTitle = t('pos.choosePaymentMethod');
  else if (step === 'cash') stepTitle = t('pos.payCash');
  else if (step === 'mixedCash') stepTitle = t('pos.mixedPayTitle');
  else if (step === 'mixedCard') stepTitle = t('pos.mixedStepCardTitle');
  else if (step === 'cardType') stepTitle = t('pos.cardTypeTitle');

  const stepBack =
    step === 'method'
      ? () => setStep('receipt')
      : step === 'cash'
        ? () => {
            setTendered('');
            setStep('method');
          }
        : step === 'mixedCash'
          ? () => setStep('method')
          : step === 'mixedCard'
            ? () => setStep('mixedCash')
            : step === 'cardType'
              ? () => setStep(payMethod === 'mixed' ? 'mixedCard' : 'method')
              : null;

  const footerPrimary =
    step === 'receipt' ? (
      <button type="button" className="pos-pay-panel__primary" onClick={() => setStep('method')}>
        {t('pos.continuePay')}
        <ArrowRight size={18} />
      </button>
    ) : step === 'mixedCash' ? (
      <button
        type="button"
        className="pos-pay-panel__primary"
        disabled={isPending || cashExceeds}
        onClick={proceedFromMixedCash}
      >
        {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
        <span>{cardRemainder > 0.001 ? t('pos.continuePay') : t('pos.completeSale')}</span>
      </button>
    ) : step === 'mixedCard' ? (
      <button type="button" className="pos-pay-panel__primary" onClick={proceedFromMixedCard}>
        {t('pos.continuePay')}
        <ArrowRight size={18} />
      </button>
    ) : step === 'cash' ? (
      <button
        type="button"
        className="pos-pay-panel__primary"
        disabled={isPending || !cashPaidEnough}
        onClick={submitCash}
      >
        {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
        <span>{t('pos.completeSale')}</span>
      </button>
    ) : null;

  if (!open) return null;

  const headerPayAmount =
    (step === 'cardType' && payMethod === 'mixed') || step === 'mixedCard'
      ? cardRemainder
      : toPay;
  const showHeaderAmount =
    step === 'method' ||
    step === 'cash' ||
    step === 'mixedCash' ||
    step === 'cardType' ||
    step === 'mixedCard';

  const registerBack = step === 'receipt' ? handleClose : stepBack;
  const showRegisterBackToCheck = step === 'method' || step === 'cash';

  return (
    <section
      className={`pos-pay-panel pos-pay-panel--register-rail is-open is-step-${step}${
        className ? ` ${className}` : ''
      }`}
      aria-label={t('pos.paymentTitle')}
    >
      <header className="pos-pay-register-rail__head">
        {registerBack ? (
          <button
            type="button"
            className="pos-pay-register-rail__back"
            onClick={registerBack}
            aria-label={step === 'receipt' ? t('pos.backToCheck') : t('common.back')}
          >
            <ArrowLeft size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <span className="pos-pay-register-rail__back pos-pay-register-rail__back--spacer" aria-hidden />
        )}
        <h2 className="pos-pay-register-rail__title">{stepTitle}</h2>
        {showHeaderAmount ? (
          <span className="pos-pay-register-rail__amount">{fmt(headerPayAmount)}</span>
        ) : (
          <span className="pos-pay-register-rail__amount pos-pay-register-rail__amount--spacer" aria-hidden />
        )}
      </header>

      <div className="pos-pay-panel__body">
        {step === 'method' || step === 'receipt' ? (
          <div className="pos-pay-panel__scroll">
            {step === 'receipt' && (
              <div className="pos-pay-panel__step">
                <div className="pos-pay-receipt-types pos-pay-receipt-types--register-stack">
                  {RECEIPT_TYPES.map(({ id, icon: Icon }) => {
                    const active = receiptType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`pos-pay-receipt-type pos-pay-receipt-type--register${
                          active ? ' is-active' : ''
                        }`}
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
              </div>
            )}

            {step === 'method' && (
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
            )}
          </div>
        ) : (
          <>
            {step === 'mixedCash' && (
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
                    <div className="pos-pay-mixed-progress__fill" style={{ width: `${mixedPercent}%` }} />
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
            )}

            {step === 'mixedCard' && (
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
            )}

            {step === 'cardType' && (
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
            )}

            {step === 'cash' && (
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
                  exactAmount={toPay}
                  disabled={isPending}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="pos-pay-panel__actions-wrap">
        {footerPrimary}
        {showRegisterBackToCheck ? (
          <button type="button" className="pos-pay-panel__back-check" onClick={handleClose}>
            <ArrowLeft size={18} aria-hidden />
            {t('pos.backToCheck')}
          </button>
        ) : null}
      </div>
    </section>
  );
}

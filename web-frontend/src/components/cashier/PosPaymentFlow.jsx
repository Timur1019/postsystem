// Оплата в левой колонке кассы (~1/3 экрана), без отдельной страницы.
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  X,
  Loader,
  CreditCard,
  Coins,
  Wallet,
  Banknote,
  Split,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import NumericKeypad, { formatKeypadAmount } from './NumericKeypad';
import { lineSubtotal } from '../../store/cartStore';
import { fmtMoney as fmt } from '../../utils/formatMoney';

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

const PAY_METHODS = [
  { id: 'cash', icon: Banknote, labelKey: 'pos.payCash', action: 'cash' },
  { id: 'card', icon: CreditCard, labelKey: 'pos.payCard', action: 'card' },
  { id: 'mixed', icon: Split, labelKey: 'pos.payMixed', action: 'mixed' },
];

function PayStepHeader({ title, onBack, onClose }) {
  const { t } = useTranslation();
  return (
    <header className="pos-pay-panel__step-head">
      {onBack ? (
        <button type="button" className="pos-pay-panel__icon-btn" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
      ) : (
        <span className="pos-pay-panel__icon-btn pos-pay-panel__icon-btn--spacer" aria-hidden />
      )}
      <h2 className="pos-pay-panel__step-title">{title}</h2>
      {onClose ? (
        <button type="button" className="pos-pay-panel__icon-btn" onClick={onClose} aria-label={t('common.close')}>
          <X size={18} strokeWidth={2} />
        </button>
      ) : (
        <span className="pos-pay-panel__icon-btn pos-pay-panel__icon-btn--spacer" aria-hidden />
      )}
    </header>
  );
}

function PayOrderMini({ items, total, discountTotal }) {
  const { t } = useTranslation();
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="pos-pay-panel__order">
      <div className="pos-pay-panel__order-head">
        <span className="pos-pay-panel__order-label">{t('pos.orderComposition')}</span>
        <span className="pos-pay-panel__order-badge">
          {t('pos.orderPositions', { count: items.length })}
        </span>
      </div>
      <div className="pos-pay-panel__order-card">
        {items.length > 0 && (
          <div
            className={`pos-pay-panel__order-items${items.length > 4 ? ' is-scrollable' : ''}`}
            aria-label={t('pos.orderComposition')}
          >
            <ul className="pos-pay-panel__order-list">
              {items.map((item) => (
                <li key={item.productId} className="pos-pay-panel__order-line">
                  <span className="pos-pay-panel__order-name">
                    {item.name}
                    {item.quantity > 1 ? (
                      <span className="pos-pay-panel__order-qty"> × {item.quantity}</span>
                    ) : null}
                  </span>
                  <span className="pos-pay-panel__order-dots" aria-hidden />
                  <span className="pos-pay-panel__order-sum">{fmt(lineSubtotal(item))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pos-pay-panel__order-summary">
          <div className="pos-pay-panel__order-row">
            <span>{t('pos.subtotal')}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="pos-pay-panel__order-row pos-pay-panel__order-row--disc">
              <span>{t('pos.discount')}</span>
              <span>−{fmt(discountTotal)}</span>
            </div>
          )}
          <div className="pos-pay-panel__order-grand">
            <span>{t('pos.total')}</span>
            <strong>{fmt(total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PosPaymentFlow({
  open,
  onClose,
  items = [],
  total,
  discountTotal = 0,
  onConfirm,
  isPending,
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
  const defaultTendered = (amount = toPay) => amountStr(amount);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

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

  const handleMethod = (action) => {
    if (action === 'cash') goToCash();
    else if (action === 'card') {
      setPayMethod('card');
      setStep('cardType');
    } else goToMixed();
  };

  const cashPartNum = round2(cashPortion);
  const cashExceeds = cashPartNum > toPay + 0.001;
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
      if (num > toPay) {
        setCashPortion(amountStr(toPay));
        toast.error(t('pos.mixedCashExceeds'), { id: 'mixed-cash-exceed' });
        return;
      }
      setCashPortion(next);
    },
    [toPay, t]
  );

  const mixedQuickActions = [
    { label: t('pos.mixedKeypadHalf'), amount: round2(toPay / 2) },
    { label: t('pos.mixedKeypadAll'), amount: toPay },
  ];

  const submitMixed = (type) => {
    if (cashExceeds || isPending) return;
    onConfirm({
      paymentMethod: 'MIXED',
      receiptType,
      cardType: cardRemainder > 0.001 ? type : null,
      cashAmount: cashPartNum,
      amountTendered: cashPartNum,
    });
  };

  const proceedFromMixedCash = () => {
    if (cashExceeds || isPending) return;
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
    const amount = Number(tendered) || 0;
    if (amount < toPay) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType,
      cardType: null,
      amountTendered: amount,
    });
  };

  const showKeypad = step === 'cash' || step === 'mixedCash';

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

  return (
    <section
      className={`pos-pay-panel${open ? ' is-open' : ''}`}
      aria-label={t('pos.paymentTitle')}
      aria-hidden={!open}
    >
      <PayOrderMini items={items} total={toPay} discountTotal={discountTotal} />

      <div className="pos-pay-panel__body">
        <PayStepHeader
          title={stepTitle}
          onBack={step !== 'receipt' ? stepBack : null}
          onClose={handleClose}
        />

        <div className="pos-pay-panel__scroll">
          {step === 'receipt' && (
            <div className="pos-pay-panel__step">
              <div className="pos-pay-receipt-types pos-pay-receipt-types--stack">
                {RECEIPT_TYPES.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`pos-pay-receipt-type${receiptType === id ? ' is-active' : ''}`}
                    onClick={() => setReceiptType(id)}
                  >
                    <Icon size={22} strokeWidth={1.5} />
                    <span>{t(`pos.receiptType.${id}`)}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="pos-pay-panel__primary" onClick={() => setStep('method')}>
                {t('pos.continuePay')}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 'method' && (
            <div className="pos-pay-panel__step">
              <div className="pos-pay-method-cards pos-pay-method-cards--stack">
                {PAY_METHODS.map(({ id, icon: Icon, labelKey, action }) => (
                  <button
                    key={id}
                    type="button"
                    className="pos-pay-method-card pos-pay-method-card--row"
                    onClick={() => handleMethod(action)}
                  >
                    <span className="pos-pay-method-card__icon">
                      <Icon size={24} strokeWidth={1.5} />
                    </span>
                    <span className="pos-pay-method-card__label">{t(labelKey)}</span>
                    <ArrowRight size={18} className="pos-pay-method-card__arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {showKeypad && (
                <NumericKeypad
                  value={cashPortion}
                  onChange={handleCashPortionChange}
                  quickActions={mixedQuickActions}
                  disabled={isPending}
                />
              )}
              <button
                type="button"
                className="pos-pay-panel__primary"
                disabled={isPending || cashExceeds}
                onClick={proceedFromMixedCash}
              >
                {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
                <span>{cardRemainder > 0.001 ? t('pos.continuePay') : t('pos.completeSale')}</span>
              </button>
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
              <button type="button" className="pos-pay-panel__primary" onClick={proceedFromMixedCard}>
                {t('pos.continuePay')}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 'cardType' && (
            <div className="pos-pay-panel__step">
              <p className="pos-pay-card-type-hint">
                {payMethod === 'mixed' ? fmt(cardRemainder) : `${fmt(toPay)} сум`}
              </p>
              <div className="pos-pay-card-types pos-pay-card-types--stack">
                {CARD_TYPES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="pos-pay-card-type pos-pay-card-type--row"
                    disabled={isPending}
                    onClick={() => submitCard(c.id)}
                  >
                    <CreditCard size={22} strokeWidth={1.5} />
                    <span>{t(c.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'cash' && (
            <div className="pos-pay-panel__step">
              <div className="pos-pay-cash-panel">
                <p className="pos-pay-cash__due">
                  <span className="pos-pay-cash__due-label">{t('pos.summaryToPay')}</span>
                  <span className="pos-pay-cash__due-value">{fmt(toPay)}</span>
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
                {tendered && Number(tendered) >= toPay && (
                  <p className="pos-pay-change">
                    {t('pos.change')}: <strong>{fmt(Number(tendered) - toPay)}</strong>
                  </p>
                )}
              </div>
              {showKeypad && (
                <NumericKeypad value={tendered} onChange={setTendered} exactAmount={toPay} disabled={isPending} />
              )}
              <button
                type="button"
                className="pos-pay-panel__primary"
                disabled={isPending || Number(tendered) < toPay}
                onClick={submitCash}
              >
                {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
                <span>{t('pos.completeSale')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

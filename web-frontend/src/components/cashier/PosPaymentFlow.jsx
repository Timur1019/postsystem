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
import PosModalPortal from './PosModalPortal';
import PosOrderComposition from './PosOrderComposition';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import { clampPayAmount, exceedsPayAmount, round2 } from '../../utils/taxAmounts';

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

function PayStepHeader({ title, onBack, onClose, toolbar = false }) {
  const { t } = useTranslation();
  if (toolbar) {
    return (
      <header className="pos-pay-modal__toolbar">
        {onBack ? (
          <button type="button" className="pos-pay-modal__nav-btn" onClick={onBack} aria-label={t('common.back')}>
            <ArrowLeft size={22} strokeWidth={2.25} />
          </button>
        ) : (
          <span className="pos-pay-modal__nav-btn pos-pay-modal__nav-btn--spacer" aria-hidden />
        )}
        <h2 className="pos-pay-modal__toolbar-title">{title}</h2>
        {onClose ? (
          <button
            type="button"
            className="pos-pay-modal__nav-btn pos-pay-modal__nav-btn--close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={22} strokeWidth={2.25} />
          </button>
        ) : (
          <span className="pos-pay-modal__nav-btn pos-pay-modal__nav-btn--spacer" aria-hidden />
        )}
      </header>
    );
  }

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


export default function PosPaymentFlow({
  open,
  onClose,
  items = [],
  total,
  discountTotal = 0,
  onConfirm,
  isPending,
  asModal = false,
  hideComposition = false,
  compactFooter = false,
  showBackToCheck = false,
  terminal = false,
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
      const max = round2(toPay);
      const clamped = clampPayAmount(num, max);
      setCashPortion(amountStr(clamped));
    },
    [toPay]
  );

  const mixedQuickActions = [
    { label: t('pos.mixedKeypadHalf'), amount: round2(toPay / 2) },
    { label: t('pos.mixedKeypadAll'), amount: toPay },
  ];

  const cashQuickActions = [
    { label: '+500', amount: 500, mode: 'add' },
    { label: '+1000', amount: 1000, mode: 'add' },
    { label: '+5000', amount: 5000, mode: 'add' },
  ];

  const tenderedNum = Number(String(tendered).replace(',', '.')) || 0;
  const changeDue = round2(Math.max(0, tenderedNum - toPay));

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
  const isModal = asModal;
  const isRegisterRail = className.includes('pos-pay-panel--register-rail');
  const isTerminalModal = isModal && terminal;
  const isSplit = className.includes('pos-pay-panel--split');
  const isRail = className.includes('pos-pay-panel--rail');
  const isCompact = compactFooter && !isModal;
  const useTileGrid =
    isCompact && !isModal && !isSplit && !isRail && !isTerminalModal && !isRegisterRail;
  const pinPrimary = useTileGrid || isSplit || isRail || isModal || isRegisterRail;
  const showAmountHero =
    !isTerminalModal &&
    !isRegisterRail &&
    (isRail || isSplit || (isModal && step !== 'receipt'));
  const useMethodStack = isRail || isSplit || isModal || isRegisterRail;
  const useReceiptRow = isTerminalModal && step === 'receipt' && !isRegisterRail;
  const useRegisterStack = isRegisterRail;
  const useCashTerminal = isTerminalModal || isRail || isRegisterRail;
  const useTerminalSteps = isTerminalModal || isRegisterRail;

  const selectReceiptType = (id) => {
    setReceiptType(id);
    if (isRegisterRail) setStep('method');
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
        disabled={isPending || Number(tendered) < toPay}
        onClick={submitCash}
      >
        {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
        <span>{t('pos.completeSale')}</span>
      </button>
    ) : null;

  const stepScroll = (
    <>
      {step === 'receipt' && (
            <div className="pos-pay-panel__step">
              <div
                className={`pos-pay-receipt-types${
                  useRegisterStack
                    ? ' pos-pay-receipt-types--register-stack'
                    : useReceiptRow
                      ? ' pos-pay-receipt-types--terminal-row'
                      : useTileGrid
                        ? ' pos-pay-receipt-types--footer-grid'
                        : ' pos-pay-receipt-types--stack'
                }`}
              >
                {RECEIPT_TYPES.map(({ id, icon: Icon }) => {
                  const active = receiptType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`pos-pay-receipt-type${
                        active ? ' is-active' : ''
                      }${useRegisterStack ? ' pos-pay-receipt-type--register' : ''}`}
                      onClick={() => selectReceiptType(id)}
                    >
                      <span className="pos-pay-receipt-type__icon-wrap">
                        <Icon size={isModal ? 30 : 22} strokeWidth={1.5} />
                      </span>
                      <span className="pos-pay-receipt-type__label">{t(`pos.receiptType.${id}`)}</span>
                      {active ? (
                        <Check
                          size={isModal ? 22 : 20}
                          strokeWidth={2.5}
                          className="pos-pay-receipt-type__check"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {!pinPrimary && !isRegisterRail ? (
                <button type="button" className="pos-pay-panel__primary" onClick={() => setStep('method')}>
                  {t('pos.continuePay')}
                  <ArrowRight size={18} />
                </button>
              ) : null}
            </div>
          )}

          {step === 'method' && (
            <div className="pos-pay-panel__step">
              {useTerminalSteps ? (
                <div className="pos-pay-method-step__hero">
                  <h3 className="pos-pay-method-step__title">{t('pos.choosePaymentMethod')}</h3>
                  <div className="pos-pay-method-step__due">
                    <span className="pos-pay-method-step__due-label">{t('pos.amountToPay')}</span>
                    <span className="pos-pay-method-step__due-value">{fmt(toPay)}</span>
                  </div>
                </div>
              ) : null}
              <div
                className={`pos-pay-method-cards${
                  useTileGrid ? ' pos-pay-method-cards--footer-grid' : ' pos-pay-method-cards--stack'
                }${useMethodStack ? ' pos-pay-method-cards--stack-vertical' : ''}${
                  useTerminalSteps ? ' pos-pay-method-cards--terminal' : ''
                }`}
              >
                {PAY_METHODS.map(({ id, icon: Icon, labelKey, action }) => (
                  <button
                    key={id}
                    type="button"
                    className={`pos-pay-method-card${
                      useTileGrid ? ' pos-pay-method-card--tile' : ' pos-pay-method-card--row'
                    }`}
                    onClick={() => handleMethod(action)}
                  >
                    <span className="pos-pay-method-card__icon">
                      <Icon size={isModal ? 30 : useTileGrid ? 20 : 24} strokeWidth={1.5} />
                    </span>
                    <span className="pos-pay-method-card__label">{t(labelKey)}</span>
                    {!useTileGrid ? (
                      <ArrowRight size={18} className="pos-pay-method-card__arrow" />
                    ) : null}
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
              {!pinPrimary ? (
                <button
                  type="button"
                  className="pos-pay-panel__primary"
                  disabled={isPending || cashExceeds}
                  onClick={proceedFromMixedCash}
                >
                  {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
                  <span>{cardRemainder > 0.001 ? t('pos.continuePay') : t('pos.completeSale')}</span>
                </button>
              ) : null}
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
              {!pinPrimary ? (
                <button type="button" className="pos-pay-panel__primary" onClick={proceedFromMixedCard}>
                  {t('pos.continuePay')}
                  <ArrowRight size={18} />
                </button>
              ) : null}
            </div>
          )}

          {step === 'cardType' && (
            <div className="pos-pay-panel__step">
              {!useTileGrid ? (
                <p className="pos-pay-card-type-hint">
                  {payMethod === 'mixed' ? fmt(cardRemainder) : `${fmt(toPay)} сум`}
                </p>
              ) : null}
              <div
                className={`pos-pay-card-types${
                  useTileGrid ? ' pos-pay-card-types--footer-grid' : ' pos-pay-card-types--stack'
                }`}
              >
                {CARD_TYPES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`pos-pay-card-type${
                      useTileGrid ? ' pos-pay-card-type--tile' : ' pos-pay-card-type--row'
                    }`}
                    disabled={isPending}
                    onClick={() => submitCard(c.id)}
                  >
                    <CreditCard size={isModal ? 30 : useTileGrid ? 20 : 22} strokeWidth={1.5} />
                    <span>{t(c.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'cash' && (
            <div className="pos-pay-panel__step">
              <div className={`pos-pay-cash-panel${useCashTerminal ? ' pos-pay-cash-panel--terminal' : ''}`}>
                {useCashTerminal ? (
                  <>
                    <div className="pos-pay-cash__summary-row">
                      <span>{t('pos.amountToPay')}</span>
                      <strong>{fmt(toPay)}</strong>
                    </div>
                    <div className="pos-pay-cash__received-box" aria-live="polite">
                      <span className="pos-pay-cash__received-label">{t('pos.receivedLabel')}</span>
                      <span className="pos-pay-cash__received-value">{formatKeypadAmount(tendered)}</span>
                    </div>
                    <div className="pos-pay-cash__change-row">
                      <span>{t('pos.change')}</span>
                      <strong>{fmt(changeDue)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="pos-pay-cash__due">
                      <span className="pos-pay-cash__due-label">{t('pos.summaryToPay')}</span>
                      <span className="pos-pay-cash__due-value">{fmt(toPay)}</span>
                    </p>
                    <label className="pos-pay-cash-label">{t('pos.amountTendered')}</label>
                    <div
                      className={`pos-pay-cash__display${
                        tendered && tenderedNum >= toPay ? ' pos-pay-cash__display--ok' : ''
                      }`}
                      aria-live="polite"
                    >
                      {formatKeypadAmount(tendered)}
                      <span className="pos-pay-cash__currency">сум</span>
                    </div>
                    {tendered && tenderedNum >= toPay ? (
                      <p className="pos-pay-change">
                        {t('pos.change')}: <strong>{fmt(changeDue)}</strong>
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              {showKeypad ? (
                <NumericKeypad
                  value={tendered}
                  onChange={setTendered}
                  exactAmount={isRail ? undefined : toPay}
                  quickActions={useCashTerminal ? cashQuickActions : undefined}
                  disabled={isPending}
                />
              ) : null}
              {!pinPrimary ? (
                <button
                  type="button"
                  className="pos-pay-panel__primary"
                  disabled={isPending || tenderedNum < toPay}
                  onClick={submitCash}
                >
                  {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
                  <span>{t('pos.completeSale')}</span>
                </button>
              ) : null}
            </div>
          )}
    </>
  );

  if (isModal) {
    if (!open) return null;

    const showMethodBack = isTerminalModal && step === 'method';

    return (
      <PosModalPortal
        open
        onClose={handleClose}
        overlayClassName={isTerminalModal ? 'pos-pay-overlay--checkout-terminal' : ''}
      >
        <div
          className={`pos-pay-modal pos-pay-modal--checkout pos-pay-modal--split-layout${
            isTerminalModal ? ' pos-pay-modal--terminal' : ''
          }${showKeypad ? ' is-keypad' : ''} is-step-${step}`}
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={t('pos.paymentTitle')}
        >
          <PayStepHeader
            toolbar
            title={stepTitle}
            onBack={step !== 'receipt' ? stepBack : null}
            onClose={handleClose}
          />

          <div className="pos-pay-modal__workspace">
            <aside className="pos-pay-modal__check">
              <PosOrderComposition
                items={items}
                total={toPay}
                discountTotal={discountTotal}
                compact
                variant={isTerminalModal ? 'terminal' : 'default'}
                headline={isTerminalModal && step === 'cash' ? 'saleSummary' : 'composition'}
              />
            </aside>
            <div className="pos-pay-modal__pay-side">
              {showAmountHero ? (
                <div className="pos-pay-panel__amount-hero">
                  <span className="pos-pay-panel__amount-hero-label">{t('pos.summaryToPay')}</span>
                  <span className="pos-pay-panel__amount-hero-value">{fmt(toPay)}</span>
                </div>
              ) : null}
              <div className="pos-pay-modal__body">{stepScroll}</div>
              {pinPrimary && (footerPrimary || showMethodBack) ? (
                <div className="pos-pay-modal__foot">
                  {footerPrimary}
                  {showMethodBack ? (
                    <button type="button" className="pos-pay-panel__back-check" onClick={handleClose}>
                      <ArrowLeft size={18} aria-hidden />
                      {t('pos.backToCheck')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </PosModalPortal>
    );
  }

  if (!open) return null;

  if (isRegisterRail) {
    const registerBack = step === 'receipt' ? handleClose : stepBack;
    const showRegisterBackToCheck = step === 'method' || step === 'cash';

    return (
      <section
        className={`pos-pay-panel pos-pay-panel--register-rail is-open is-step-${step}${
          className ? ` ${className}` : ''}`}
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
          {step === 'method' || step === 'cash' ? (
            <span className="pos-pay-register-rail__amount">{fmt(toPay)}</span>
          ) : (
            <span className="pos-pay-register-rail__amount pos-pay-register-rail__amount--spacer" aria-hidden />
          )}
        </header>

        <div className="pos-pay-panel__body">
          {step === 'method' || step === 'receipt' ? (
            <div className="pos-pay-panel__scroll">{stepScroll}</div>
          ) : (
            stepScroll
          )}
        </div>

        <div className="pos-pay-panel__actions-wrap">
          {pinPrimary && footerPrimary ? footerPrimary : null}
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

  if (isRail) {
    const railTitle =
      step === 'method'
        ? t('pos.choosePaymentMethod')
        : step === 'cash'
          ? null
          : stepTitle;

    return (
      <section
        className={`pos-pay-panel pos-pay-panel--rail is-open${className ? ` ${className}` : ''}`}
        aria-label={t('pos.paymentTitle')}
      >
        {railTitle || (step !== 'cash' && showAmountHero) ? (
          <div className="pos-pay-panel__rail-head">
            {railTitle ? <h2 className="pos-pay-panel__rail-title">{railTitle}</h2> : null}
            {step !== 'cash' && showAmountHero ? (
              <div className="pos-pay-panel__amount-hero">
                <span className="pos-pay-panel__amount-hero-label">{t('pos.amountToPay')}</span>
                <span className="pos-pay-panel__amount-hero-value">{fmt(toPay)}</span>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="pos-pay-panel__body">
          {step !== 'method' && step !== 'receipt' && step !== 'cash' ? (
            <PayStepHeader title={stepTitle} onBack={stepBack} onClose={null} />
          ) : null}
          {step === 'method' || step === 'receipt' ? (
            <div className="pos-pay-panel__scroll">{stepScroll}</div>
          ) : (
            stepScroll
          )}
          <div className="pos-pay-panel__actions-wrap">
            {pinPrimary && footerPrimary ? footerPrimary : null}
            {showBackToCheck ? (
              <button type="button" className="pos-pay-panel__back-check" onClick={handleClose}>
                <ArrowLeft size={18} aria-hidden />
                {t('pos.backToCheck')}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (isSplit) {
    return (
      <section
        className={`pos-pay-panel pos-pay-panel--split is-open${className ? ` ${className}` : ''}`}
        aria-label={t('pos.paymentTitle')}
      >
        <aside className="pos-pay-panel__check-col">
          <PosOrderComposition items={items} total={toPay} discountTotal={discountTotal} compact />
        </aside>
        <div className="pos-pay-panel__pay-col">
          {showAmountHero ? (
            <div className="pos-pay-panel__amount-hero">
              <span className="pos-pay-panel__amount-hero-label">{t('pos.summaryToPay')}</span>
              <span className="pos-pay-panel__amount-hero-value">{fmt(toPay)}</span>
            </div>
          ) : null}
          <PayStepHeader
            title={stepTitle}
            onBack={step !== 'receipt' ? stepBack : null}
            onClose={handleClose}
          />
          <div className="pos-pay-panel__scroll">{stepScroll}</div>
          {pinPrimary && footerPrimary ? (
            <div className="pos-pay-panel__actions-wrap">{footerPrimary}</div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`pos-pay-panel${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      aria-label={t('pos.paymentTitle')}
      aria-hidden={!open}
    >
      {!hideComposition ? (
        <PosOrderComposition
          className="pos-pay-panel__composition"
          items={items}
          total={toPay}
          discountTotal={discountTotal}
          compact
        />
      ) : (
        <div className="pos-pay-panel__total-bar">
          <span className="pos-pay-panel__total-label">{t('pos.grandTotal')}</span>
          <span className="pos-pay-panel__total-value">{fmt(toPay)}</span>
        </div>
      )}

      <div className="pos-pay-panel__body">
        <PayStepHeader
          title={stepTitle}
          onBack={step !== 'receipt' ? stepBack : null}
          onClose={handleClose}
        />
        <div className="pos-pay-panel__scroll">{stepScroll}</div>
        {pinPrimary && footerPrimary ? (
          <div className="pos-pay-panel__actions">{footerPrimary}</div>
        ) : null}
      </div>
    </section>
  );
}

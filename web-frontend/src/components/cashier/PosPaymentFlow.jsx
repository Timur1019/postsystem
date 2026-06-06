import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import { clampPayAmount, exceedsPayAmount, round2 } from '../../utils/taxAmounts';
import { setPosReceiptPrintEnabled, isPosReceiptPrintEnabled } from '../../utils/receiptPrintPreference';
import PrintReceiptToggle from './payment/PrintReceiptToggle';
import PosPaymentReceiptStep from './payment/PosPaymentReceiptStep';
import PosPaymentMethodStep from './payment/PosPaymentMethodStep';
import PosPaymentCashStep from './payment/PosPaymentCashStep';
import PosPaymentMixedCashStep from './payment/PosPaymentMixedCashStep';
import PosPaymentMixedCardStep from './payment/PosPaymentMixedCardStep';
import PosPaymentCardTypeStep from './payment/PosPaymentCardTypeStep';
import {
  STEPS_WITH_PRINT_TOGGLE,
  amountStr,
  isDeferredReceiptType,
  parseTenderedInput,
} from './payment/posPaymentConstants';

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
  const [printReceiptEnabled, setPrintReceiptEnabled] = useState(isPosReceiptPrintEnabled);

  const reset = () => {
    setStep('receipt');
    setReceiptType('SALE');
    setPayMethod(null);
    setTendered('');
    setCashPortion('');
    setPrintReceiptEnabled(isPosReceiptPrintEnabled());
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
    setTendered(toPay > 0 ? amountStr(toPay) : '');
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
      printReceipt: printReceiptEnabled,
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
      printReceipt: printReceiptEnabled,
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
      printReceipt: printReceiptEnabled,
    });
  };

  const submitDeferred = () => {
    if (isPending) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType,
      cardType: null,
      cashAmount: 0,
      cardAmount: 0,
      amountTendered: 0,
      printReceipt: printReceiptEnabled,
    });
  };

  const handlePrintReceiptChange = (e) => {
    const next = Boolean(e.target.checked);
    setPrintReceiptEnabled(next);
    setPosReceiptPrintEnabled(next);
  };

  const selectReceiptType = (id) => {
    setReceiptType(id);
    if (id === 'SALE') setStep('method');
  };

  const deferredReceipt = isDeferredReceiptType(receiptType);

  let stepTitle = t('pos.receiptTypeTitle');
  if (step === 'receipt' && deferredReceipt) stepTitle = t(`pos.receiptType.${receiptType}`);
  else if (step === 'method') stepTitle = t('pos.choosePaymentMethod');
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
      deferredReceipt ? (
        <button
          type="button"
          className="pos-pay-panel__primary"
          disabled={isPending}
          onClick={submitDeferred}
        >
          {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
          <span>{t('pos.completeReceiptType', { type: t(`pos.receiptType.${receiptType}`) })}</span>
        </button>
      ) : null
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
    (step === 'receipt' && deferredReceipt) ||
    step === 'method' ||
    step === 'cash' ||
    step === 'mixedCash' ||
    step === 'cardType' ||
    step === 'mixedCard';

  const registerBack = step === 'receipt' ? handleClose : stepBack;
  const showRegisterBackToCheck = step === 'method' || step === 'cash';
  const showPrintToggle =
    STEPS_WITH_PRINT_TOGGLE.has(step) && (step !== 'receipt' || deferredReceipt);

  const printToggle = showPrintToggle ? (
    <PrintReceiptToggle checked={printReceiptEnabled} onChange={handlePrintReceiptChange} t={t} />
  ) : null;

  const footerMain =
    footerPrimary && showPrintToggle ? (
      <div className="pos-pay-panel__footer-row">
        <div className="pos-pay-panel__footer-row__primary">{footerPrimary}</div>
        {printToggle}
      </div>
    ) : footerPrimary && !showPrintToggle ? (
      footerPrimary
    ) : showPrintToggle ? (
      <div className="pos-pay-panel__footer-row pos-pay-panel__footer-row--toggle-only">{printToggle}</div>
    ) : null;

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
              <PosPaymentReceiptStep
                t={t}
                receiptType={receiptType}
                selectReceiptType={selectReceiptType}
                toPay={toPay}
              />
            )}
            {step === 'method' && (
              <PosPaymentMethodStep t={t} toPay={toPay} handleMethod={handleMethod} />
            )}
          </div>
        ) : (
          <>
            {step === 'mixedCash' && (
              <PosPaymentMixedCashStep
                t={t}
                toPay={toPay}
                cashPortion={cashPortion}
                setCashPortion={setCashPortion}
                cardRemainder={cardRemainder}
                mixedDistributed={mixedDistributed}
                mixedPercent={mixedPercent}
                cashExceeds={cashExceeds}
                mixedQuickActions={mixedQuickActions}
                handleCashPortionChange={handleCashPortionChange}
                isPending={isPending}
              />
            )}
            {step === 'mixedCard' && (
              <PosPaymentMixedCardStep t={t} cashPartNum={cashPartNum} cardRemainder={cardRemainder} />
            )}
            {step === 'cardType' && (
              <PosPaymentCardTypeStep t={t} isPending={isPending} submitCard={submitCard} />
            )}
            {step === 'cash' && (
              <PosPaymentCashStep
                t={t}
                toPay={toPay}
                tendered={tendered}
                setTendered={setTendered}
                changeDue={changeDue}
                cashPaidEnough={cashPaidEnough}
                cashShortfall={cashShortfall}
                isPending={isPending}
              />
            )}
          </>
        )}
      </div>

      <div className="pos-pay-panel__actions-wrap">
        {footerMain}
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

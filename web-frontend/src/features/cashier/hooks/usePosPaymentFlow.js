import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { financeApi } from '../../../api/finance.api';
import { clampPayAmount, exceedsPayAmount, round2 } from '../../../utils/taxAmounts';
import { setPosReceiptPrintEnabled, isPosReceiptPrintEnabled } from '../../../utils/receiptPrintPreference';
import {
  STEPS_WITH_PRINT_TOGGLE,
  amountStr,
  isDeferredReceiptType,
  parseTenderedInput,
} from '../components/payment/posPaymentConstants';
import { usePosCreditCustomerPicker } from './usePosCreditCustomerPicker';

export function usePosPaymentFlow({ open, onClose, total, onConfirm, isPending }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('receipt');
  const [receiptType, setReceiptType] = useState('SALE');
  const [payMethod, setPayMethod] = useState(null);
  const [tendered, setTendered] = useState('');
  const [cashPortion, setCashPortion] = useState('');
  const [printReceiptEnabled, setPrintReceiptEnabled] = useState(isPosReceiptPrintEnabled);
  const [advanceAmountUsed, setAdvanceAmountUsed] = useState(0);
  const [advanceInput, setAdvanceInput] = useState('');
  const [advanceBalance, setAdvanceBalance] = useState(0);

  const creditCustomer = usePosCreditCustomerPicker({ enabled: open && step === 'creditCustomer' });

  const reset = () => {
    setStep('receipt');
    setReceiptType('SALE');
    setPayMethod(null);
    setTendered('');
    setCashPortion('');
    setAdvanceAmountUsed(0);
    setAdvanceInput('');
    setAdvanceBalance(0);
    setPrintReceiptEnabled(isPosReceiptPrintEnabled());
    creditCustomer.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const checkTotal = round2(total);
  const effectiveToPay = advanceAmountUsed > 0
    ? round2(Math.max(0, checkTotal - advanceAmountUsed))
    : checkTotal;

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const goToCash = () => {
    setPayMethod((prev) => prev === 'advance' ? 'advance' : 'cash');
    setTendered(effectiveToPay > 0 ? amountStr(effectiveToPay) : '');
    setStep('cash');
  };

  const goToMixed = () => {
    setPayMethod((prev) => (prev === 'advance' ? 'advance' : 'mixed'));
    setCashPortion('');
    setStep('mixedCash');
  };

  const handleMethod = (action) => {
    if (action === 'cash') goToCash();
    else if (action === 'card') {
      setPayMethod(advanceAmountUsed > 0 ? 'advance' : 'card');
      setStep('cardType');
    } else if (action === 'advance') {
      setPayMethod('advance');
      setAdvanceAmountUsed(0);
      setAdvanceInput('');
      setAdvanceBalance(0);
      setStep('creditCustomer');
    } else if (action === 'cashless') submitCashless();
    else goToMixed();
  };

  const cashPartNum = round2(cashPortion);
  const cashExceeds = exceedsPayAmount(cashPartNum, effectiveToPay);
  const cardRemainder = round2(Math.max(0, effectiveToPay - cashPartNum));
  const mixedDistributed = round2(Math.min(cashPartNum, effectiveToPay));
  const mixedPercent = effectiveToPay > 0
    ? Math.min(100, Math.round((mixedDistributed / effectiveToPay) * 100))
    : 0;

  const handleCashPortionChange = useCallback(
    (next) => {
      if (next === '') {
        setCashPortion('');
        return;
      }
      const num = round2(next);
      const clamped = clampPayAmount(num, effectiveToPay);
      setCashPortion(amountStr(clamped));
    },
    [effectiveToPay]
  );

  const mixedQuickActions = [
    { label: t('pos.mixedKeypadHalf'), amount: round2(effectiveToPay / 2) },
    { label: t('pos.mixedKeypadAll'), amount: effectiveToPay },
  ];

  const tenderedNum = parseTenderedInput(tendered);
  const changeDue = round2(Math.max(0, tenderedNum - effectiveToPay));
  const cashPaidEnough = tenderedNum >= effectiveToPay && tenderedNum > 0;
  const cashShortfall = tenderedNum > 0 && tenderedNum < effectiveToPay
    ? round2(effectiveToPay - tenderedNum)
    : 0;

  const withDeferredCustomer = (payment) => {
    if (receiptType !== 'ADVANCE' && receiptType !== 'CREDIT') return payment;
    return {
      ...payment,
      customerId: creditCustomer.selectedId || payment.customerId,
      customerName: creditCustomer.selectedName || payment.customerName,
    };
  };

  const withAdvancePayment = (payment) => {
    const base = withDeferredCustomer(payment);
    if (advanceAmountUsed <= 0) return base;
    return {
      ...base,
      customerId: creditCustomer.selectedId,
      customerName: creditCustomer.selectedName,
      advanceAmount: advanceAmountUsed,
    };
  };

  const submitMixed = (type) => {
    if (isPending || cashExceeds) return;
    const cash = clampPayAmount(cashPartNum, effectiveToPay);
    const card = round2(Math.max(0, effectiveToPay - cash));
    if (cash <= 0 && card <= 0 && advanceAmountUsed <= 0) return;
    onConfirm(withAdvancePayment({
      paymentMethod: 'MIXED',
      receiptType,
      cardType: card > 0.001 ? type : null,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: cash,
      printReceipt: printReceiptEnabled,
    }));
  };

  const proceedFromMixedCash = () => {
    if (isPending || cashExceeds) return;
    if (cashPartNum <= 0 && effectiveToPay > 0) {
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
    if (payMethod === 'mixed' || (payMethod === 'advance' && step === 'mixedCard')) {
      submitMixed(type);
      return;
    }
    onConfirm(withAdvancePayment({
      paymentMethod: 'CARD',
      receiptType,
      cardType: type,
      amountTendered: effectiveToPay,
      printReceipt: printReceiptEnabled,
    }));
  };

  const submitCash = () => {
    const amount = parseTenderedInput(tendered);
    if (amount < effectiveToPay) return;
    onConfirm(withAdvancePayment({
      paymentMethod: 'CASH',
      receiptType,
      cardType: null,
      amountTendered: amount,
      printReceipt: printReceiptEnabled,
    }));
  };

  const submitCashless = () => {
    if (isPending) return;
    onConfirm(withAdvancePayment({
      paymentMethod: 'CASHLESS',
      receiptType,
      cardType: null,
      amountTendered: effectiveToPay,
      printReceipt: printReceiptEnabled,
    }));
  };

  const submitDeferred = (customerId = null, customerName = null) => {
    if (isPending) return;
    if (receiptType === 'CREDIT' && !customerId) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType,
      cardType: null,
      cashAmount: 0,
      cardAmount: 0,
      amountTendered: 0,
      customerId,
      customerName,
      printReceipt: printReceiptEnabled,
    });
  };

  const submitFullAdvance = (amount) => {
    if (isPending || !creditCustomer.selectedId) return;
    onConfirm({
      paymentMethod: 'CASH',
      receiptType: 'SALE',
      cardType: null,
      cashAmount: 0,
      cardAmount: 0,
      amountTendered: 0,
      customerId: creditCustomer.selectedId,
      customerName: creditCustomer.selectedName,
      advanceAmount: amount,
      printReceipt: printReceiptEnabled,
    });
  };

  const proceedFromDeferred = () => {
    if (isPending) return;
    if (receiptType === 'CREDIT' || receiptType === 'ADVANCE') {
      setStep('creditCustomer');
      return;
    }
    submitDeferred();
  };

  const submitCreditWithCustomer = async () => {
    if (!creditCustomer.selectedId) {
      toast.error(t('pos.creditCustomerRequired'));
      return;
    }
    if (payMethod === 'advance') {
      try {
        const balance = await financeApi.debts.advances.balance(creditCustomer.selectedId).then((r) => r.data);
        const available = round2(Number(balance) || 0);
        if (available <= 0) {
          toast.error(t('pos.advanceNotAvailable'));
          return;
        }
        const maxUse = Math.min(available, checkTotal);
        setAdvanceBalance(available);
        setAdvanceInput(amountStr(maxUse));
        setStep('advanceAmount');
      } catch {
        toast.error(t('pos.advanceBalanceLoadFailed'));
      }
      return;
    }
    if (receiptType === 'ADVANCE') {
      setStep('method');
      return;
    }
    submitDeferred(creditCustomer.selectedId, creditCustomer.selectedName);
  };

  const submitAdvanceAmount = () => {
    const amount = round2(Number(advanceInput) || 0);
    const maxUse = Math.min(advanceBalance, checkTotal);
    if (amount <= 0 || amount > maxUse) {
      toast.error(t('pos.advanceAmountInvalid'));
      return;
    }
    setAdvanceAmountUsed(amount);
    const remainder = round2(checkTotal - amount);
    if (remainder > 0.001) {
      setStep('method');
      return;
    }
    submitFullAdvance(amount);
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
  else if (step === 'advanceAmount') stepTitle = t('pos.advanceAmountTitle');
  else if (step === 'creditCustomer') {
    if (payMethod === 'advance') stepTitle = t('pos.advanceCustomerTitle');
    else stepTitle = receiptType === 'ADVANCE' ? t('pos.advanceCustomerTitle') : t('pos.creditCustomerTitle');
  }

  const stepBack =
    step === 'method'
      ? () => {
          if (advanceAmountUsed > 0) {
            setAdvanceAmountUsed(0);
            setStep('advanceAmount');
            return;
          }
          if (receiptType === 'ADVANCE') setStep('creditCustomer');
          else setStep('receipt');
        }
      : step === 'advanceAmount'
        ? () => setStep('creditCustomer')
      : step === 'creditCustomer'
        ? () => (payMethod === 'advance' ? setStep('method') : setStep('receipt'))
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
              ? () => setStep(payMethod === 'mixed' || payMethod === 'advance' ? 'mixedCard' : 'method')
              : null;

  const headerPayAmount =
    (step === 'cardType' && (payMethod === 'mixed' || payMethod === 'advance')) || step === 'mixedCard'
      ? cardRemainder
      : step === 'advanceAmount'
        ? checkTotal
        : effectiveToPay;
  const showHeaderAmount =
    (step === 'receipt' && deferredReceipt) ||
    step === 'creditCustomer' ||
    step === 'advanceAmount' ||
    step === 'method' ||
    step === 'cash' ||
    step === 'mixedCash' ||
    step === 'cardType' ||
    step === 'mixedCard';

  const registerBack = step === 'receipt' ? handleClose : stepBack;
  const showRegisterBackToCheck = step === 'method' || step === 'cash';
  const showPrintToggle =
    STEPS_WITH_PRINT_TOGGLE.has(step) && (step !== 'receipt' || deferredReceipt);
  const showFooterPrimary =
    (step === 'receipt' && deferredReceipt) ||
    step === 'creditCustomer' ||
    step === 'advanceAmount' ||
    step === 'mixedCash' ||
    step === 'mixedCard' ||
    step === 'cash';

  return {
    t,
    step,
    receiptType,
    payMethod,
    tendered,
    setTendered,
    cashPortion,
    setCashPortion,
    printReceiptEnabled,
    toPay: effectiveToPay,
    checkTotal,
    advanceInput,
    setAdvanceInput,
    advanceBalance,
    handleClose,
    handleMethod,
    handleCashPortionChange,
    handlePrintReceiptChange,
    selectReceiptType,
    submitCard,
    cashPartNum,
    cardRemainder,
    mixedDistributed,
    mixedPercent,
    cashExceeds,
    mixedQuickActions,
    changeDue,
    cashPaidEnough,
    cashShortfall,
    isPending,
    stepTitle,
    registerBack,
    showHeaderAmount,
    headerPayAmount,
    deferredReceipt,
    submitDeferred,
    proceedFromDeferred,
    submitCreditWithCustomer,
    submitAdvanceAmount,
    creditCustomer,
    proceedFromMixedCash,
    proceedFromMixedCard,
    submitCash,
    showRegisterBackToCheck,
    showPrintToggle,
    showFooterPrimary,
  };
}

import { Loader, ArrowRight, Check } from 'lucide-react';

export default function PosPaymentFlowFooterPrimary({
  step,
  deferredReceipt,
  isPending,
  cashExceeds,
  cashPaidEnough,
  cardRemainder,
  receiptType,
  t,
  onSubmitDeferred,
  onProceedFromMixedCash,
  onProceedFromMixedCard,
  onSubmitCash,
}) {
  if (step === 'receipt') {
    if (!deferredReceipt) return null;
    return (
      <button
        type="button"
        className="pos-pay-panel__primary"
        disabled={isPending}
        onClick={onSubmitDeferred}
      >
        {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
        <span>{t('pos.completeReceiptType', { type: t(`pos.receiptType.${receiptType}`) })}</span>
      </button>
    );
  }
  if (step === 'mixedCash') {
    return (
      <button
        type="button"
        className="pos-pay-panel__primary"
        disabled={isPending || cashExceeds}
        onClick={onProceedFromMixedCash}
      >
        {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
        <span>{cardRemainder > 0.001 ? t('pos.continuePay') : t('pos.completeSale')}</span>
      </button>
    );
  }
  if (step === 'mixedCard') {
    return (
      <button type="button" className="pos-pay-panel__primary" onClick={onProceedFromMixedCard}>
        {t('pos.continuePay')}
        <ArrowRight size={18} />
      </button>
    );
  }
  if (step === 'cash') {
    return (
      <button
        type="button"
        className="pos-pay-panel__primary"
        disabled={isPending || !cashPaidEnough}
        onClick={onSubmitCash}
      >
        {isPending ? <Loader size={18} className="pos-pay-panel__spin" /> : <Check size={18} />}
        <span>{t('pos.completeSale')}</span>
      </button>
    );
  }
  return null;
}

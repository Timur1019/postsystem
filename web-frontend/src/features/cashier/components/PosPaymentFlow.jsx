import { ArrowLeft } from 'lucide-react';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import PrintReceiptToggle from './payment/PrintReceiptToggle';
import PosPaymentReceiptStep from './payment/PosPaymentReceiptStep';
import PosPaymentMethodStep from './payment/PosPaymentMethodStep';
import PosPaymentCashStep from './payment/PosPaymentCashStep';
import PosPaymentMixedCashStep from './payment/PosPaymentMixedCashStep';
import PosPaymentMixedCardStep from './payment/PosPaymentMixedCardStep';
import PosPaymentCardTypeStep from './payment/PosPaymentCardTypeStep';
import PosPaymentFlowFooterPrimary from './payment/PosPaymentFlowFooterPrimary';
import { usePosPaymentFlow } from '../hooks/usePosPaymentFlow';

export default function PosPaymentFlow({
  open,
  onClose,
  total,
  onConfirm,
  isPending,
  className = '',
}) {
  const p = usePosPaymentFlow({ open, onClose, total, onConfirm, isPending });

  if (!open) return null;

  const printToggle = p.showPrintToggle ? (
    <PrintReceiptToggle
      checked={p.printReceiptEnabled}
      onChange={p.handlePrintReceiptChange}
      t={p.t}
    />
  ) : null;

  const footerPrimary = p.showFooterPrimary ? (
    <PosPaymentFlowFooterPrimary
      step={p.step}
      deferredReceipt={p.deferredReceipt}
      isPending={p.isPending}
      cashExceeds={p.cashExceeds}
      cashPaidEnough={p.cashPaidEnough}
      cardRemainder={p.cardRemainder}
      receiptType={p.receiptType}
      t={p.t}
      onSubmitDeferred={p.submitDeferred}
      onProceedFromMixedCash={p.proceedFromMixedCash}
      onProceedFromMixedCard={p.proceedFromMixedCard}
      onSubmitCash={p.submitCash}
    />
  ) : null;

  const footerMain =
    footerPrimary && p.showPrintToggle ? (
      <div className="pos-pay-panel__footer-row">
        <div className="pos-pay-panel__footer-row__primary">{footerPrimary}</div>
        {printToggle}
      </div>
    ) : footerPrimary && !p.showPrintToggle ? (
      footerPrimary
    ) : p.showPrintToggle ? (
      <div className="pos-pay-panel__footer-row pos-pay-panel__footer-row--toggle-only">{printToggle}</div>
    ) : null;

  return (
    <section
      className={`pos-pay-panel pos-pay-panel--register-rail is-open is-step-${p.step}${
        className ? ` ${className}` : ''
      }`}
      aria-label={p.t('pos.paymentTitle')}
    >
      <header className="pos-pay-register-rail__head">
        {p.registerBack ? (
          <button
            type="button"
            className="pos-pay-register-rail__back"
            onClick={p.registerBack}
            aria-label={p.step === 'receipt' ? p.t('pos.backToCheck') : p.t('common.back')}
          >
            <ArrowLeft size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <span className="pos-pay-register-rail__back pos-pay-register-rail__back--spacer" aria-hidden />
        )}
        <h2 className="pos-pay-register-rail__title">{p.stepTitle}</h2>
        {p.showHeaderAmount ? (
          <span className="pos-pay-register-rail__amount">{fmt(p.headerPayAmount)}</span>
        ) : (
          <span className="pos-pay-register-rail__amount pos-pay-register-rail__amount--spacer" aria-hidden />
        )}
      </header>

      <div className="pos-pay-panel__body">
        {p.step === 'method' || p.step === 'receipt' ? (
          <div className="pos-pay-panel__scroll">
            {p.step === 'receipt' && (
              <PosPaymentReceiptStep
                t={p.t}
                receiptType={p.receiptType}
                selectReceiptType={p.selectReceiptType}
                toPay={p.toPay}
              />
            )}
            {p.step === 'method' && (
              <PosPaymentMethodStep t={p.t} toPay={p.toPay} handleMethod={p.handleMethod} />
            )}
          </div>
        ) : (
          <>
            {p.step === 'mixedCash' && (
              <PosPaymentMixedCashStep
                t={p.t}
                toPay={p.toPay}
                cashPortion={p.cashPortion}
                setCashPortion={p.setCashPortion}
                cardRemainder={p.cardRemainder}
                mixedDistributed={p.mixedDistributed}
                mixedPercent={p.mixedPercent}
                cashExceeds={p.cashExceeds}
                mixedQuickActions={p.mixedQuickActions}
                handleCashPortionChange={p.handleCashPortionChange}
                isPending={p.isPending}
              />
            )}
            {p.step === 'mixedCard' && (
              <PosPaymentMixedCardStep
                t={p.t}
                cashPartNum={p.cashPartNum}
                cardRemainder={p.cardRemainder}
              />
            )}
            {p.step === 'cardType' && (
              <PosPaymentCardTypeStep t={p.t} isPending={p.isPending} submitCard={p.submitCard} />
            )}
            {p.step === 'cash' && (
              <PosPaymentCashStep
                t={p.t}
                toPay={p.toPay}
                tendered={p.tendered}
                setTendered={p.setTendered}
                changeDue={p.changeDue}
                cashPaidEnough={p.cashPaidEnough}
                cashShortfall={p.cashShortfall}
                isPending={p.isPending}
              />
            )}
          </>
        )}
      </div>

      <div className="pos-pay-panel__actions-wrap">
        {footerMain}
        {p.showRegisterBackToCheck ? (
          <button type="button" className="pos-pay-panel__back-check" onClick={p.handleClose}>
            <ArrowLeft size={18} aria-hidden />
            {p.t('pos.backToCheck')}
          </button>
        ) : null}
      </div>
    </section>
  );
}

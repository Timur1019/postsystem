import { Banknote, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PosTotalsBlock from './PosTotalsBlock';

export default function PosRegisterFooter({
  items,
  total,
  discountTotal,
  onReturn,
  onClear,
  canClear,
  onCheckout,
  checkoutDisabled,
  onDiscount,
  className = '',
}) {
  const { t } = useTranslation();

  return (
    <aside className={`pos-order-rail pos-order-rail--side${className ? ` ${className}` : ''}`}>
      <button type="button" className="pos-order-rail__return" onClick={onReturn}>
        <RotateCcw size={18} aria-hidden />
        <span>{t('pos.return')}</span>
      </button>

      <div className="pos-order-rail__spacer" aria-hidden />

      <PosTotalsBlock
        className="pos-totals-block--order-rail"
        items={items}
        total={total}
        discountTotal={discountTotal}
      />

      <div className="pos-order-rail__btn-row">
        <button type="button" className="pos-order-rail__btn pos-order-rail__btn--discount" onClick={onDiscount}>
          {t('pos.discount')}
        </button>
        <button
          type="button"
          className="pos-order-rail__btn pos-order-rail__btn--clear"
          onClick={onClear}
          disabled={!canClear}
        >
          {t('pos.clearCart')}
        </button>
      </div>

      <button
        type="button"
        className="pos-order-rail__pay"
        disabled={checkoutDisabled}
        onClick={onCheckout}
      >
        <Banknote size={24} strokeWidth={1.75} aria-hidden />
        <span>{t('pos.toPayment')}</span>
      </button>
    </aside>
  );
}

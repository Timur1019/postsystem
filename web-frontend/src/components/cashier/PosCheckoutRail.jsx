import { Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PosTotalsBlock from './PosTotalsBlock';

export default function PosCheckoutRail({
  items,
  total,
  discountTotal,
  onCheckout,
  checkoutDisabled,
  className = '',
}) {
  const { t } = useTranslation();

  return (
    <section className={`pos-checkout-rail${className ? ` ${className}` : ''}`}>
      <div className="pos-checkout-rail__card">
        <button
          type="button"
          className="pos-checkout-btn pos-checkout-rail__pay"
          disabled={checkoutDisabled}
          onClick={onCheckout}
        >
          <Banknote size={32} strokeWidth={1.75} />
          <span className="pos-checkout-rail__pay-label">{t('pos.toPayment')}</span>
        </button>
        <div className="pos-checkout-rail__totals">
          <PosTotalsBlock
            className="pos-totals-block--rail"
            items={items}
            total={total}
            discountTotal={discountTotal}
          />
        </div>
      </div>
    </section>
  );
}

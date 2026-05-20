import { useTranslation } from 'react-i18next';
import { lineDiscountAmount } from '../../store/cartStore';
import { fmtMoney as fmt, fmtMoneyCompact as fmtCompact } from '../../utils/formatMoney';

export default function PosTotalsBlock({ items = [], total, discountTotal = 0, className = '' }) {
  const { t } = useTranslation();
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountPct =
    items.length > 0
      ? Math.round(
          (items.reduce((s, i) => s + lineDiscountAmount(i), 0) / Math.max(1, subtotal)) * 100
        )
      : 0;
  const hasDiscount = discountTotal > 0.001;
  const showAllRows =
    className.includes('pos-totals-block--rail') || className.includes('pos-totals-block--checkout');
  const showDiscountRow = showAllRows || hasDiscount;

  return (
    <div className={`pos-totals-block${className ? ` ${className}` : ''}`}>
      <div className="pos-totals-block__meta">
        <div className="pos-totals-block__row">
          <span>{t('pos.subtotal')}</span>
          <span title={fmt(subtotal)}>{fmtCompact(subtotal)}</span>
        </div>
        {showDiscountRow ? (
          <div className="pos-totals-block__row pos-totals-block__row--disc">
            <span>
              {t('pos.discount')}
              {discountPct > 0 ? ` ${discountPct}%` : ''}
            </span>
            <span title={fmt(discountTotal)}>−{fmtCompact(discountTotal)}</span>
          </div>
        ) : null}
      </div>
      <div className="pos-totals-block__hero">
        <span className="pos-totals-block__hero-label">{t('pos.grandTotal')}</span>
        <span className="pos-totals-block__hero-value" title={fmt(total)}>
          {fmtCompact(total)}
        </span>
      </div>
    </div>
  );
}

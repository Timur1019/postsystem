import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt, fmtMoneyCompact as fmtCompact } from '../../utils/formatMoney';

export default function PosTotalsBlock({ items = [], total, discountTotal = 0, className = '' }) {
  const { t } = useTranslation();
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountPct =
    subtotal > 0 && discountTotal > 0 ? Math.round((discountTotal / subtotal) * 100) : 0;
  const hasDiscount = discountTotal > 0.001;
  const showAllRows =
    className.includes('pos-totals-block--rail') || className.includes('pos-totals-block--checkout');
  const showDiscountRow = showAllRows || hasDiscount;
  const isRail = className.includes('pos-totals-block--rail');
  const totalDisplay = fmtCompact(total);
  const heroFitClass =
    isRail && totalDisplay.length >= 12
      ? 'pos-totals-block__hero-value--fit-xs'
      : isRail && totalDisplay.length >= 10
        ? 'pos-totals-block__hero-value--fit-sm'
        : '';

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
        <span className={`pos-totals-block__hero-value${heroFitClass ? ` ${heroFitClass}` : ''}`}>
          {totalDisplay}
        </span>
      </div>
    </div>
  );
}

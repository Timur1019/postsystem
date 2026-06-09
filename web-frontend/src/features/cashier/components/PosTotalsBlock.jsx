import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt, fmtMoneyCompact as fmtCompact } from '../../../utils/formatMoney';

export default function PosTotalsBlock({ items = [], total, discountTotal = 0, className = '' }) {
  const { t } = useTranslation();
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountPct =
    subtotal > 0 && discountTotal > 0 ? Math.round((discountTotal / subtotal) * 100) : 0;
  const hasDiscount = discountTotal > 0.001;
  const showDiscountRow = hasDiscount;
  const totalDisplay = fmtCompact(total);

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
        <span className="pos-totals-block__hero-value">
          {totalDisplay}
        </span>
      </div>
    </div>
  );
}

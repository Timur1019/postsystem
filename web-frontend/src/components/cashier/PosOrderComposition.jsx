// Состав заказа: список позиций + подытог / скидка / ИТОГО (как на экране оплаты)
import { useTranslation } from 'react-i18next';
import { lineSubtotal } from '../../store/cartStore';
import { fmtMoney as fmt } from '../../utils/formatMoney';

export default function PosOrderComposition({
  items = [],
  total,
  discountTotal = 0,
  className = '',
  compact = false,
}) {
  const { t } = useTranslation();
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className={`pos-order-composition${className ? ` ${className}` : ''}`}>
      <div className="pos-order-composition__head">
        <span className="pos-order-composition__label">{t('pos.orderComposition')}</span>
        <span className="pos-order-composition__badge">
          {t('pos.orderPositions', { count: items.length })}
        </span>
      </div>

      <div className="pos-order-composition__card">
        {items.length > 0 && (
          <div
            className={`pos-order-composition__items${items.length > 4 ? ' is-scrollable' : ''}${
              compact ? ' is-compact' : ''
            }`}
          >
            <ul className="pos-order-composition__list">
              {items.map((item) => (
                <li key={item.productId} className="pos-order-composition__line">
                  <span className="pos-order-composition__name">
                    {item.name}
                    {item.quantity > 1 ? (
                      <span className="pos-order-composition__qty"> × {item.quantity}</span>
                    ) : null}
                  </span>
                  <span className="pos-order-composition__dots" aria-hidden />
                  <span className="pos-order-composition__sum">{fmt(lineSubtotal(item))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pos-order-composition__summary">
          <div className="pos-order-composition__row">
            <span>{t('pos.subtotal')}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="pos-order-composition__row pos-order-composition__row--disc">
              <span>{t('pos.discount')}</span>
              <span>−{fmt(discountTotal)}</span>
            </div>
          )}
          <div className="pos-order-composition__grand">
            <span>{t('pos.grandTotal')}</span>
            <strong>{fmt(total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

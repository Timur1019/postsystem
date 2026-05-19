// Состав заказа на экранах оплаты (только отображение)
import { useTranslation } from 'react-i18next';
import { lineDiscountAmount, lineSubtotal } from '../../store/cartStore';
import { fmtMoney as fmt } from '../../utils/formatMoney';

export default function PaymentOrderSummary({ items, total, discountTotal }) {
  const { t } = useTranslation();
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <aside className="pos-pay-order">
      <header className="pos-pay-order__head">
        <h2>{t('pos.orderComposition')}</h2>
        <p>{t('pos.orderPositions', { count: items.length })}</p>
      </header>

      <ul className="pos-pay-order__list">
        {items.map((item) => (
          <li key={item.productId} className="pos-pay-order__line">
            <div className="pos-pay-order__line-row">
              <div className="min-w-0">
                <p className="pos-pay-order__line-name">{item.name}</p>
                <p className="pos-pay-order__line-meta">
                  {fmt(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <span className="fw-semibold text-nowrap">{fmt(lineSubtotal(item))}</span>
            </div>
          </li>
        ))}
      </ul>

      <footer className="pos-pay-order__foot">
        <div className="pos-pay-order__row">
          <span>{t('pos.subtotal')}</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="pos-pay-order__row pos-pay-order__row--disc">
          <span>{t('pos.discount')}</span>
          <span>−{fmt(discountTotal)}</span>
        </div>
        <div className="pos-pay-order__total-block">
          <span className="pos-pay-order__total-label">{t('pos.total')}</span>
          <span className="pos-pay-order__total-value">{fmt(total)}</span>
        </div>
      </footer>
    </aside>
  );
}

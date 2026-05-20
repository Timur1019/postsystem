import { useTranslation } from 'react-i18next';
import PosCheckoutRail from './PosCheckoutRail';

export default function PosRegisterFooter({
  items,
  total,
  discountTotal,
  onReturn,
  onClear,
  canClear,
  onCheckout,
  checkoutDisabled,
}) {
  const { t } = useTranslation();

  return (
    <footer className="cashier-register__footer">
      <div className="cashier-register__footer-cell cashier-register__footer-cell--actions">
        <button type="button" className="pos-footer-action-btn pos-footer-action-btn--warn" onClick={onReturn}>
          {t('pos.return')}
        </button>
        <button
          type="button"
          className="pos-footer-action-btn pos-footer-action-btn--muted"
          onClick={onClear}
          disabled={!canClear}
        >
          {t('pos.clearCart')}
        </button>
      </div>
      <div className="cashier-register__footer-cell cashier-register__footer-cell--pay">
        <PosCheckoutRail
          items={items}
          total={total}
          discountTotal={discountTotal}
          onCheckout={onCheckout}
          checkoutDisabled={checkoutDisabled}
        />
      </div>
    </footer>
  );
}

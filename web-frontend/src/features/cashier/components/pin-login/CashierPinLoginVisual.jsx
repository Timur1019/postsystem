import { PIN_LOGIN_HERO_URL } from '../../utils/cashierPinUtils';

export default function CashierPinLoginVisual() {
  return (
    <aside className="cashier-pin-login__visual" aria-hidden="true">
      <img
        className="cashier-pin-login__visual-img"
        src={PIN_LOGIN_HERO_URL}
        alt=""
        decoding="async"
      />
      <div className="cashier-pin-login__visual-overlay" />
    </aside>
  );
}

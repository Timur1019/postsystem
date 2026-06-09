import BrandMark from '../../../../components/shared/BrandMark';

export default function CashierPinLoginHeader({ appName, subtitle }) {
  return (
    <header className="cashier-pin-login__header">
      <div className="cashier-pin-login__logo">
        <BrandMark size={32} iconClassName="text-white" />
      </div>
      <h1 className="cashier-pin-login__title">{appName}</h1>
      <p className="cashier-pin-login__subtitle">{subtitle}</p>
    </header>
  );
}

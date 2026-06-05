import { fmtMoney } from '../utils/formatMoney';
import ShelfLabelBarcode from './ShelfLabelBarcode';
import '../styles/shelf-label-print.css';

export default function ShelfLabelSheet({
  variant,
  productName,
  barcode,
  price,
  showName,
  showBarcode,
  showPrice,
  currency,
  layoutKey,
}) {
  const isPriceTag = variant === 'priceTag';
  const hasPrice = price != null && !Number.isNaN(Number(price));

  return (
    <div
      className={`shelflabel-card ${isPriceTag ? 'shelflabel-card--pricetag' : 'shelflabel-card--label'} shelflabel-card--tone`}
    >
      {isPriceTag && showPrice && hasPrice && (
        <div className="shelflabel-price shelflabel-price--large">
          {fmtMoney(price)} {currency}
        </div>
      )}
      {showName && productName && <div className="shelflabel-name">{productName}</div>}
      {showBarcode && <ShelfLabelBarcode value={barcode || ''} layoutKey={layoutKey} />}
      {!isPriceTag && showPrice && hasPrice && (
        <div className="shelflabel-price shelflabel-price--footer">
          {fmtMoney(price)} {currency}
        </div>
      )}
    </div>
  );
}

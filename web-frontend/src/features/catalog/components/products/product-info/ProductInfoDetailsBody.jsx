import ProductInfoIdentifiersCard from './ProductInfoIdentifiersCard';
import ProductInfoAttributesCard from './ProductInfoAttributesCard';
import ProductInfoPricesCard from './ProductInfoPricesCard';

export default function ProductInfoDetailsBody({ t, product }) {
  return (
    <div className="space-y-6">
      <ProductInfoIdentifiersCard t={t} product={product} />
      <ProductInfoAttributesCard t={t} product={product} />
      <ProductInfoPricesCard t={t} storePrices={product.storePrices} />
    </div>
  );
}

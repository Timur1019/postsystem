import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export function renderPosCatalogProduct(p, { viewMode, t, onAddProduct }) {
  if (viewMode === 'list') {
    return (
      <button key={p.id} type="button" className="pos-product-row" onClick={() => onAddProduct(p)}>
        <div className="pos-product-row__main">
          <span className="pos-product-row__name">{p.name}</span>
          {p.sku ? (
            <span className="pos-product-row__code">
              {t('pos.productCode')}: {p.sku}
            </span>
          ) : null}
        </div>
        <span className="pos-product-row__price">{fmt(p.sellingPrice)}</span>
      </button>
    );
  }

  return (
    <button key={p.id} type="button" className="pos-product-card" onClick={() => onAddProduct(p)}>
      <span className="pos-product-card__price">{fmt(p.sellingPrice)}</span>
      {p.sku ? <span className="pos-product-card__code">{p.sku}</span> : null}
      <span className="pos-product-card__name">{p.name}</span>
    </button>
  );
}

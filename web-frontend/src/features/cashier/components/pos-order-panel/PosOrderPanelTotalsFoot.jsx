import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export default function PosOrderPanelTotalsFoot({
  t,
  subtotalBeforeTax,
  taxTotal,
  taxRateLabel,
  payableTotal,
}) {
  return (
    <footer className="pos-order-panel__totals-foot">
      <div className="pos-order-panel__totals-meta">
        <p>
          {t('pos.subtotal')}: <span>{fmt(subtotalBeforeTax)}</span>
        </p>
        <p>
          {t('pos.taxLine', { rate: taxRateLabel })}: <span>{fmt(taxTotal)}</span>
        </p>
      </div>
      <div className="pos-order-panel__totals-hero">
        <span className="pos-order-panel__totals-hero-label">{t('pos.totalPayable')}</span>
        <strong className="pos-order-panel__totals-hero-value">{fmt(payableTotal)}</strong>
      </div>
    </footer>
  );
}

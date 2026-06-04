import { format } from 'date-fns';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import {
  CashierSalesStatusBadge,
  cashierSalesPaymentLabel,
  cashierSalesPaymentPillClass,
} from './cashierSalesDisplay';

export default function CashierSalesCardsList({ rows, isPending, selectedId, onRowClick, t }) {
  if (isPending) {
    return <p className="cashier-sales-table__empty">{t('common.loading')}</p>;
  }
  if (rows.length === 0) {
    return <p className="cashier-sales-table__empty">{t('pos.noSales')}</p>;
  }
  return (
    <div className="cashier-sales-mobile-list">
      {rows.map((row) => (
        <article
          key={row.id}
          className={`cashier-sales-mobile-card${row.id === selectedId ? ' is-selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => onRowClick(row)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onRowClick(row);
            }
          }}
        >
          <div className="cashier-sales-mobile-card__top">
            <span className="cashier-sales-mobile-card__receipt">{row.receiptNumber}</span>
            <span className="cashier-sales-mobile-card__amount">{fmt(row.totalAmount)}</span>
          </div>
          <div className="cashier-sales-mobile-card__meta">
            <span>
              {row.createdAt ? format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
            </span>
            <span className={`cashier-sales-pill ${cashierSalesPaymentPillClass(row.paymentMethod)}`}>
              {cashierSalesPaymentLabel(row.paymentMethod, t)}
            </span>
            <CashierSalesStatusBadge status={row.status} t={t} />
          </div>
        </article>
      ))}
    </div>
  );
}

import { format } from 'date-fns';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import {
  CashierSalesStatusBadge,
  cashierSalesPaymentLabel,
  cashierSalesPaymentPillClass,
} from './cashierSalesDisplay';

export default function CashierSalesTable({ rows, isPending, selectedId, onRowClick, t }) {
  return (
    <div className="cashier-sales-table-wrap">
      <table className="cashier-sales-table">
        <thead>
          <tr>
            <th>{t('pos.receipt')}</th>
            <th>{t('pos.date')}</th>
            <th className="cashier-sales-table__col-num">{t('pos.total')}</th>
            <th>{t('pos.payment')}</th>
            <th>{t('pos.salesFilterStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {isPending ? (
            <tr>
              <td colSpan={5} className="cashier-sales-table__empty">
                {t('common.loading')}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="cashier-sales-table__empty">
                {t('pos.noSales')}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={`cashier-sales-table__row${row.id === selectedId ? ' is-selected' : ''}`}
                onClick={() => onRowClick(row)}
              >
                <td className="cashier-sales-table__receipt">{row.receiptNumber}</td>
                <td className="cashier-sales-table__date">
                  {row.createdAt ? format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                </td>
                <td className="cashier-sales-table__amount">{fmt(row.totalAmount)}</td>
                <td>
                  <span className={`cashier-sales-pill ${cashierSalesPaymentPillClass(row.paymentMethod)}`}>
                    {cashierSalesPaymentLabel(row.paymentMethod, t)}
                  </span>
                </td>
                <td>
                  <CashierSalesStatusBadge status={row.status} t={t} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

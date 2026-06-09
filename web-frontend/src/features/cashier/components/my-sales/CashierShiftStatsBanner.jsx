import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export default function CashierShiftStatsBanner({ shift, t }) {
  const opened =
    shift?.openedAt != null ? format(new Date(shift.openedAt), 'dd.MM.yyyy HH:mm') : '—';

  return (
    <div className="cashier-sales-shift-stats mb-3 flex-shrink-0">
      <div className="cashier-sales-shift-stats__icon">
        <Clock size={20} aria-hidden />
      </div>
      <div className="cashier-sales-shift-stats__body">
        <p className="cashier-sales-shift-stats__title">{t('pos.currentShiftSales')}</p>
        <div className="cashier-sales-shift-stats__grid">
          <div className="cashier-sales-shift-stats__item">
            <span className="cashier-sales-shift-stats__label">{t('pos.shiftOpenLabel')}</span>
            <span className="cashier-sales-shift-stats__value">{opened}</span>
          </div>
          <div className="cashier-sales-shift-stats__item">
            <span className="cashier-sales-shift-stats__label">{t('pos.shiftSales')}</span>
            <span className="cashier-sales-shift-stats__value">{shift?.saleCount ?? 0}</span>
          </div>
          <div className="cashier-sales-shift-stats__item">
            <span className="cashier-sales-shift-stats__label">{t('pos.total')}</span>
            <span className="cashier-sales-shift-stats__value cashier-sales-shift-stats__value--sum">
              {fmt(shift?.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

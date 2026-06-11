import { Filter, X } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { hasActiveCashierSalesFilters } from './cashierSalesFilterUtils';

export default function CashierSalesFilters({ filters, onPatch, onReset, filtering, t }) {
  const active = hasActiveCashierSalesFilters(filters);

  return (
    <div
      className={`cashier-sales-filters-card mb-3 flex-shrink-0${active ? ' is-active' : ''}`}
    >
      <div className="cashier-sales-filters-card__head">
        <div className="cashier-sales-filters-card__title">
          <Filter size={16} aria-hidden />
          {t('pos.salesFiltersTitle')}
          {active ? (
            <span className="cashier-sales-filters-card__badge">{t('pos.salesFilterActive')}</span>
          ) : null}
        </div>
        {active ? (
          <button type="button" className="cashier-sales-filters-card__reset" onClick={onReset}>
            <X size={14} aria-hidden />
            {t('pos.salesFilterReset')}
          </button>
        ) : null}
      </div>
      <form className="cashier-sales-filters-card__body" onSubmit={(e) => e.preventDefault()}>
        <div className="cashier-sales-filters">
          <div className="cashier-sales-filters__field">
            <label className="cashier-sales-filters__label" htmlFor="sales-filter-receipt">
              {t('pos.receipt')}
            </label>
            <input
              id="sales-filter-receipt"
              type="text"
              className="cashier-sales-filters__input"
              placeholder={t('pos.returnReceiptPh')}
              value={filters.receiptNumber}
              onChange={(e) => onPatch({ receiptNumber: e.target.value })}
            />
          </div>
          <div className="cashier-sales-filters__field">
            <label className="cashier-sales-filters__label" htmlFor="sales-filter-from">
              {t('pos.salesFilterFrom')}
            </label>
            <input
              id="sales-filter-from"
              type="date"
              className="cashier-sales-filters__input"
              value={filters.from}
              onChange={(e) => onPatch({ from: e.target.value })}
            />
          </div>
          <div className="cashier-sales-filters__field">
            <label className="cashier-sales-filters__label" htmlFor="sales-filter-to">
              {t('pos.salesFilterTo')}
            </label>
            <input
              id="sales-filter-to"
              type="date"
              className="cashier-sales-filters__input"
              value={filters.to}
              onChange={(e) => onPatch({ to: e.target.value })}
            />
          </div>
          <div className="cashier-sales-filters__field">
            <BaseSelect
              id="sales-filter-payment"
              className="cashier-sales-filters__select"
              label={t('pos.payment')}
              value={filters.paymentMethod}
              onChange={(e) => onPatch({ paymentMethod: e.target.value })}
              placeholder={t('pos.salesFilterAll')}
              options={[
                { value: '', label: t('pos.salesFilterAll') },
                { value: 'CASH', label: t('pos.payCash') },
                { value: 'CARD', label: t('pos.payCard') },
                { value: 'CASHLESS', label: t('pos.payCashless') },
                { value: 'MIXED', label: t('pos.payMixed') },
                { value: 'MPESA', label: 'M-Pesa' },
              ]}
            />
          </div>
          <div className="cashier-sales-filters__field">
            <BaseSelect
              id="sales-filter-status"
              className="cashier-sales-filters__select"
              label={t('pos.salesFilterStatus')}
              value={filters.status}
              onChange={(e) => onPatch({ status: e.target.value })}
              placeholder={t('pos.salesFilterAll')}
              options={[
                { value: '', label: t('pos.salesFilterAll') },
                { value: 'COMPLETED', label: t('pos.statusCompleted') },
                { value: 'VOIDED', label: t('pos.statusVoided') },
                { value: 'REFUNDED', label: t('pos.statusRefunded') },
              ]}
            />
          </div>
        </div>
        {filtering ? (
          <p className="cashier-sales-filters-card__hint text-muted small mb-0 mt-2">{t('common.loading')}</p>
        ) : null}
      </form>
    </div>
  );
}

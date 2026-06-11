import { BaseButton, BaseInput, BaseSelect } from '../../../components/ui';

export default function FinanceListFilters({
  t,
  from,
  setFrom,
  to,
  setTo,
  categoryId,
  setCategoryId,
  categories = [],
  paymentMethod,
  setPaymentMethod,
  onReset,
  showCategory = false,
  showPaymentMethod = false,
}) {
  return (
    <div className="finance-filters">
      <div className="finance-filters__field">
        <BaseInput type="date" label={t('finance.reports.from')} value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="finance-filters__field">
        <BaseInput type="date" label={t('finance.reports.to')} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {showCategory ? (
        <div className="finance-filters__field finance-filters__field--wide">
          <BaseSelect
            label={t('finance.common.category')}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder={t('finance.filters.allCategories')}
            options={[
              { value: '', label: t('finance.filters.allCategories') },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
        </div>
      ) : null}
      {showPaymentMethod ? (
        <div className="finance-filters__field">
          <BaseSelect
            label={t('finance.common.paymentMethod')}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder={t('finance.filters.allMethods')}
            options={[
              { value: '', label: t('finance.filters.allMethods') },
              { value: 'CASH', label: t('finance.payment.cash') },
              { value: 'CARD', label: t('finance.payment.card') },
              { value: 'BANK', label: t('finance.payment.bank') },
            ]}
          />
        </div>
      ) : null}
      <BaseButton variant="secondary" onClick={onReset}>{t('finance.filters.reset')}</BaseButton>
    </div>
  );
}

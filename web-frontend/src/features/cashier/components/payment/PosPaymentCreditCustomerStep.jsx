import { Loader, Plus, Search, User } from 'lucide-react';

export default function PosPaymentCreditCustomerStep({
  t,
  hint,
  search,
  setSearch,
  customers,
  selectedId,
  selectCustomer,
  isLoading,
  isFetching,
  isError,
  showCreate,
  toggleCreate,
  createName,
  setCreateName,
  createPhone,
  setCreatePhone,
  submitCreate,
  isCreating,
}) {
  return (
    <div className="pos-pay-credit-customer">
      <p className="pos-pay-credit-customer__hint">{hint}</p>

      <div className="pos-pay-credit-customer__search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          className="pos-pay-credit-customer__search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('pos.creditCustomerSearchPh')}
          autoComplete="off"
        />
      </div>

      <button type="button" className="pos-pay-credit-customer__create-toggle" onClick={toggleCreate}>
        <Plus size={16} aria-hidden />
        {showCreate ? t('pos.creditCustomerHideCreate') : t('pos.creditCustomerNew')}
      </button>

      {showCreate ? (
        <div className="pos-pay-credit-customer__create">
          <label className="pos-pay-credit-customer__field">
            <span>{t('pos.creditCustomerName')}</span>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={t('pos.creditCustomerNamePh')}
              autoComplete="off"
            />
          </label>
          <label className="pos-pay-credit-customer__field">
            <span>{t('pos.creditCustomerPhone')}</span>
            <input
              type="tel"
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder={t('pos.creditCustomerPhonePh')}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="pos-pay-credit-customer__create-btn"
            disabled={isCreating}
            onClick={submitCreate}
          >
            {isCreating ? <Loader size={16} className="pos-pay-panel__spin" /> : <Plus size={16} />}
            {t('pos.creditCustomerSave')}
          </button>
        </div>
      ) : null}

      <div className="pos-pay-credit-customer__list" role="listbox" aria-label={t('pos.creditCustomerList')}>
        {isLoading || isFetching ? (
          <div className="pos-pay-credit-customer__state">
            <Loader size={20} className="pos-pay-panel__spin" />
            <span>{t('common.loading')}</span>
          </div>
        ) : isError ? (
          <div className="pos-pay-credit-customer__state pos-pay-credit-customer__state--error">
            {t('pos.creditCustomerLoadError')}
          </div>
        ) : customers.length === 0 ? (
          <div className="pos-pay-credit-customer__state">{t('pos.creditCustomerEmpty')}</div>
        ) : (
          customers.map((customer) => {
            const active = selectedId === customer.id;
            return (
              <button
                key={customer.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`pos-pay-credit-customer__item${active ? ' is-active' : ''}`}
                onClick={() => selectCustomer(customer)}
              >
                <span className="pos-pay-credit-customer__item-icon">
                  <User size={18} aria-hidden />
                </span>
                <span className="pos-pay-credit-customer__item-body">
                  <span className="pos-pay-credit-customer__item-name">{customer.name}</span>
                  {customer.phone ? (
                    <span className="pos-pay-credit-customer__item-meta">{customer.phone}</span>
                  ) : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

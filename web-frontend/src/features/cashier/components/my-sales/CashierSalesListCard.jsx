import CashierSalesCardsList from './CashierSalesCardsList';
import CashierSalesPagination from './CashierSalesPagination';
import CashierSalesTable from './CashierSalesTable';
import CashierSalesViewToggle from './CashierSalesViewToggle';

export default function CashierSalesListCard({
  rows,
  isPending,
  page,
  totalPages,
  totalElements,
  onPageChange,
  selectedId,
  viewMode,
  onViewModeChange,
  onRowClick,
  t,
}) {
  const listModeClass = viewMode === 'cards' ? 'is-view-cards' : 'is-view-list';

  return (
    <div className={`cashier-sales-card cashier-sales-list-card ${listModeClass}`}>
      <div className="cashier-sales-card__head">
        <span className="cashier-sales-card__head-title">{t('pos.salesListTitle')}</span>
        <CashierSalesViewToggle viewMode={viewMode} onChange={onViewModeChange} t={t} />
      </div>
      <div className="cashier-page__table-wrap cashier-sales-card__table cashier-sales-card__scroll">
        <CashierSalesCardsList
          rows={rows}
          isPending={isPending}
          selectedId={selectedId}
          onRowClick={onRowClick}
          t={t}
        />
        <CashierSalesTable
          rows={rows}
          isPending={isPending}
          selectedId={selectedId}
          onRowClick={onRowClick}
          t={t}
        />
      </div>
      <CashierSalesPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={onPageChange}
        t={t}
      />
    </div>
  );
}

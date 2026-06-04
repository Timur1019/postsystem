export default function CashierSalesPagination({ page, totalPages, totalElements, onPageChange, t }) {
  const pages = Math.max(totalPages, 1);
  if (totalElements <= 0 && totalPages <= 0) return null;

  const pageItems = [];
  const maxButtons = 7;
  let start = Math.max(0, page - Math.floor(maxButtons / 2));
  let end = Math.min(pages - 1, start + maxButtons - 1);
  start = Math.max(0, end - maxButtons + 1);
  for (let i = start; i <= end; i += 1) pageItems.push(i);

  return (
    <div className="cashier-sales-pagination">
      <span className="cashier-sales-pagination__info">
        {t('common.pageOf', { current: page + 1, total: pages })}
        <span className="cashier-sales-pagination__sep">·</span>
        {t('pos.salesTotalCount', { count: totalElements })}
      </span>
      <div className="cashier-sales-pagination__controls">
        <button
          type="button"
          className="cashier-sales-pagination__btn"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          {t('common.prev')}
        </button>
        {pageItems.map((n) => (
          <button
            key={n}
            type="button"
            className={`cashier-sales-pagination__btn${n === page ? ' is-active' : ''}`}
            onClick={() => onPageChange(n)}
          >
            {n + 1}
          </button>
        ))}
        <button
          type="button"
          className="cashier-sales-pagination__btn"
          disabled={page >= pages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

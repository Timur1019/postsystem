// src/pages/cashier/CashierMySalesPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Clock, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { saleApi } from '../../services/api';
import { useCashierShift } from '../../hooks/useCashierShift';
import { useCashierStore } from '../../hooks/useCashierStore';
import { fmtMoney as fmt } from '../../utils/formatMoney';

const PAGE_SIZE = 14;
const RECEIPT_DEBOUNCE_MS = 400;

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const EMPTY_FILTERS = {
  receiptNumber: '',
  paymentMethod: '',
  status: '',
  from: '',
  to: '',
};

function hasActiveFilters(filters) {
  return Boolean(
    filters.receiptNumber?.trim() ||
      filters.paymentMethod ||
      filters.status ||
      filters.from ||
      filters.to
  );
}

function normalizeFilters(filters) {
  let { from, to } = filters;
  if (from && to && from > to) {
    [from, to] = [to, from];
  }
  return { ...filters, from, to };
}

function buildQueryParams(filters, page) {
  const params = { page, size: PAGE_SIZE };
  if (filters.receiptNumber?.trim()) params.receiptNumber = filters.receiptNumber.trim();
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  return params;
}

function paymentLabel(method, t) {
  switch (method) {
    case 'CASH':
      return t('pos.payCash');
    case 'CARD':
      return t('pos.payCard');
    case 'MIXED':
      return t('pos.payMixed');
    case 'MPESA':
      return 'M-Pesa';
    default:
      return method || '—';
  }
}

function paymentPillClass(method) {
  switch (method) {
    case 'CASH':
      return 'cashier-sales-pill--cash';
    case 'CARD':
      return 'cashier-sales-pill--card';
    case 'MIXED':
      return 'cashier-sales-pill--mixed';
    case 'MPESA':
      return 'cashier-sales-pill--mpesa';
    default:
      return '';
  }
}

function statusBadge(status, t) {
  if (status === 'VOIDED') {
    return <span className="cashier-sales-badge cashier-sales-badge--voided">{t('pos.statusVoided')}</span>;
  }
  if (status === 'REFUNDED') {
    return <span className="cashier-sales-badge cashier-sales-badge--refunded">{t('pos.statusRefunded')}</span>;
  }
  if (status === 'COMPLETED') {
    return <span className="cashier-sales-badge cashier-sales-badge--completed">{t('pos.statusCompleted')}</span>;
  }
  return null;
}

function SalesFilters({ filters, onPatch, onReset, filtering, t }) {
  const active = hasActiveFilters(filters);

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
            <label className="cashier-sales-filters__label" htmlFor="sales-filter-payment">
              {t('pos.payment')}
            </label>
            <select
              id="sales-filter-payment"
              className="cashier-sales-filters__select"
              value={filters.paymentMethod}
              onChange={(e) => onPatch({ paymentMethod: e.target.value })}
            >
              <option value="">{t('pos.salesFilterAll')}</option>
              <option value="CASH">{t('pos.payCash')}</option>
              <option value="CARD">{t('pos.payCard')}</option>
              <option value="MIXED">{t('pos.payMixed')}</option>
              <option value="MPESA">M-Pesa</option>
            </select>
          </div>
          <div className="cashier-sales-filters__field">
            <label className="cashier-sales-filters__label" htmlFor="sales-filter-status">
              {t('pos.salesFilterStatus')}
            </label>
            <select
              id="sales-filter-status"
              className="cashier-sales-filters__select"
              value={filters.status}
              onChange={(e) => onPatch({ status: e.target.value })}
            >
              <option value="">{t('pos.salesFilterAll')}</option>
              <option value="COMPLETED">{t('pos.statusCompleted')}</option>
              <option value="VOIDED">{t('pos.statusVoided')}</option>
              <option value="REFUNDED">{t('pos.statusRefunded')}</option>
            </select>
          </div>
        </div>
        {filtering ? (
          <p className="cashier-sales-filters-card__hint text-muted small mb-0 mt-2">{t('common.loading')}</p>
        ) : null}
      </form>
    </div>
  );
}

function SalesPagination({ page, totalPages, totalElements, onPageChange, t }) {
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

function SalesTable({ rows, isPending, onReturn, voidPending, onRowClick, t }) {
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
            <th className="cashier-sales-table__actions" />
          </tr>
        </thead>
        <tbody>
          {isPending ? (
            <tr>
              <td colSpan={6} className="cashier-sales-table__empty">
                {t('common.loading')}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="cashier-sales-table__empty">
                {t('pos.noSales')}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="cashier-sales-table__row" onClick={() => onRowClick(row)}>
                <td className="cashier-sales-table__receipt">{row.receiptNumber}</td>
                <td className="cashier-sales-table__date">
                  {row.createdAt ? format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                </td>
                <td className="cashier-sales-table__amount">{fmt(row.totalAmount)}</td>
                <td>
                  <span className={`cashier-sales-pill ${paymentPillClass(row.paymentMethod)}`}>
                    {paymentLabel(row.paymentMethod, t)}
                  </span>
                </td>
                <td>{statusBadge(row.status, t)}</td>
                <td className="cashier-sales-table__actions">
                  {row.status !== 'VOIDED' && onReturn ? (
                    <button
                      type="button"
                      className="cashier-sales-table__return"
                      onClick={(e) => onReturn(row, e)}
                      disabled={voidPending}
                    >
                      {t('pos.return')}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ShiftStatsBanner({ shift, t }) {
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

function SalesListCard({
  rows,
  isPending,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onReturn,
  voidPending,
  onRowClick,
  t,
}) {
  return (
    <div className="cashier-sales-card">
      <div className="cashier-sales-card__table">
        <SalesTable
          rows={rows}
          isPending={isPending}
          onReturn={onReturn}
          voidPending={voidPending}
          onRowClick={onRowClick}
          t={t}
        />
      </div>
      <SalesPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={onPageChange}
        t={t}
      />
    </div>
  );
}

export default function CashierMySalesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { storeId } = useCashierStore();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const debouncedReceipt = useDebouncedValue(filters.receiptNumber, RECEIPT_DEBOUNCE_MS);
  const appliedFilters = useMemo(
    () => normalizeFilters({ ...filters, receiptNumber: debouncedReceipt }),
    [filters.paymentMethod, filters.status, filters.from, filters.to, debouncedReceipt]
  );
  const filtering = filters.receiptNumber !== debouncedReceipt;
  const { data: shift, isPending: shiftLoading } = useCashierShift(storeId);

  const shiftId = shift?.id;

  useEffect(() => {
    setPage(0);
  }, [appliedFilters]);

  const salesQueryParams = useMemo(
    () => buildQueryParams(appliedFilters, page),
    [appliedFilters, page]
  );

  const {
    data: sales,
    isPending: salesLoading,
    isError: salesError,
  } = useQuery({
    queryKey: ['my-sales', salesQueryParams],
    queryFn: () => saleApi.mySales(salesQueryParams).then((r) => r.data),
    enabled: !!shiftId,
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) => saleApi.voidSale(id, reason),
    onSuccess: () => {
      toast.success(t('pos.returnSuccess'));
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.returnFailed')),
  });

  const handleReturn = (row, e) => {
    e.stopPropagation();
    if (row.status === 'VOIDED') return;
    const reason = window.prompt(t('pos.returnReason'), t('pos.returnDefaultReason'));
    if (reason == null) return;
    voidMutation.mutate({ id: row.id, reason });
  };

  const patchFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const rows = sales?.content ?? [];

  return (
    <div className="cashier-page">
      <h1 className="h5 fw-bold mb-3 flex-shrink-0">{t('pos.mySalesTitle')}</h1>

      <SalesFilters
        filters={filters}
        onPatch={patchFilters}
        onReset={resetFilters}
        filtering={filtering}
        t={t}
      />

      {salesError && (
        <div className="alert alert-danger py-2 mb-3 flex-shrink-0" role="alert">
          {t('pos.salesLoadFailed')}
        </div>
      )}

      <div className="cashier-page__scroll">
        {shiftLoading ? (
          <p className="text-muted small">{t('common.loading')}</p>
        ) : !shiftId ? (
          <div className="alert alert-warning mb-0">{t('pos.shiftRequired')}</div>
        ) : (
          <>
            <ShiftStatsBanner shift={shift} t={t} />
            <SalesListCard
              rows={rows}
              isPending={salesLoading || filtering}
              page={page}
              totalPages={sales?.totalPages ?? 0}
              totalElements={sales?.totalElements ?? 0}
              onPageChange={setPage}
              onReturn={handleReturn}
              voidPending={voidMutation.isPending}
              onRowClick={(row) => navigate(`/receipt/${row.receiptNumber}`)}
              t={t}
            />
          </>
        )}
      </div>
    </div>
  );
}

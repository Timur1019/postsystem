// src/pages/cashier/CashierMySalesPage.jsx
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronDown, Clock, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { cashierShiftApi, saleApi } from '../../services/api';
import { useCashierStore } from '../../hooks/useCashierStore';
import { fmtMoney as fmt } from '../../utils/formatMoney';

const PAGE_SIZE = 10;

const EMPTY_FILTERS = {
  receiptNumber: '',
  paymentMethod: '',
  status: '',
  from: '',
  to: '',
};

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

function statusBadge(status, t) {
  if (status === 'VOIDED') {
    return <span className="cashier-sales-badge cashier-sales-badge--voided">{t('pos.statusVoided')}</span>;
  }
  if (status === 'REFUNDED') {
    return <span className="cashier-sales-badge cashier-sales-badge--refunded">{t('pos.statusRefunded')}</span>;
  }
  return null;
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

function SalesFilters({ filters, onPatch, onApply, onReset, t }) {
  return (
    <div className="cashier-sales-card mb-3 flex-shrink-0">
      <div className="cashier-sales-card__head d-flex align-items-center gap-2">
        <Filter size={16} aria-hidden />
        {t('pos.salesFiltersTitle')}
      </div>
      <form
        className="p-2 px-3"
        onSubmit={(e) => {
          e.preventDefault();
          onApply();
        }}
      >
        <div className="cashier-sales-filters">
          <div className="cashier-sales-filters__field cashier-sales-filters__field--receipt">
            <label className="form-label small mb-1" htmlFor="sales-filter-receipt">
              {t('pos.receipt')}
            </label>
            <input
              id="sales-filter-receipt"
              type="text"
              className="form-control form-control-sm"
              placeholder={t('pos.returnReceiptPh')}
              value={filters.receiptNumber}
              onChange={(e) => onPatch({ receiptNumber: e.target.value })}
            />
          </div>
          <div className="cashier-sales-filters__field cashier-sales-filters__field--date">
            <label className="form-label small mb-1" htmlFor="sales-filter-from">
              {t('pos.salesFilterFrom')}
            </label>
            <input
              id="sales-filter-from"
              type="date"
              className="form-control form-control-sm"
              value={filters.from}
              onChange={(e) => onPatch({ from: e.target.value })}
            />
          </div>
          <div className="cashier-sales-filters__field cashier-sales-filters__field--date">
            <label className="form-label small mb-1" htmlFor="sales-filter-to">
              {t('pos.salesFilterTo')}
            </label>
            <input
              id="sales-filter-to"
              type="date"
              className="form-control form-control-sm"
              value={filters.to}
              onChange={(e) => onPatch({ to: e.target.value })}
            />
          </div>
          <div className="cashier-sales-filters__field cashier-sales-filters__field--select">
            <label className="form-label small mb-1" htmlFor="sales-filter-payment">
              {t('pos.payment')}
            </label>
            <select
              id="sales-filter-payment"
              className="form-select form-select-sm"
              value={filters.paymentMethod}
              onChange={(e) => onPatch({ paymentMethod: e.target.value })}
            >
              <option value="">{t('pos.salesFilterAll')}</option>
              <option value="CASH">{t('pos.payCash')}</option>
              <option value="CARD">{t('pos.payCard')}</option>
              <option value="MIXED">{t('pos.payMixed')}</option>
            </select>
          </div>
          <div className="cashier-sales-filters__field cashier-sales-filters__field--select">
            <label className="form-label small mb-1" htmlFor="sales-filter-status">
              {t('pos.salesFilterStatus')}
            </label>
            <select
              id="sales-filter-status"
              className="form-select form-select-sm"
              value={filters.status}
              onChange={(e) => onPatch({ status: e.target.value })}
            >
              <option value="">{t('pos.salesFilterAll')}</option>
              <option value="COMPLETED">{t('pos.statusCompleted')}</option>
              <option value="VOIDED">{t('pos.statusVoided')}</option>
              <option value="REFUNDED">{t('pos.statusRefunded')}</option>
            </select>
          </div>
          <div className="cashier-sales-filters__actions">
            <button type="submit" className="btn btn-success btn-sm">
              {t('common.apply')}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onReset}>
              {t('pos.salesFilterReset')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SalesPagination({ page, totalPages, totalElements, onPageChange, t }) {
  if (!totalElements) return null;
  return (
    <div className="cashier-sales-pagination">
      <span className="text-muted">
        {t('common.pageOf', { current: page + 1, total: Math.max(totalPages, 1) })}
        {' · '}
        {totalElements}
      </span>
      <div className="btn-group btn-group-sm">
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          {t('common.prev')}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={page >= totalPages - 1}
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
    <table className="cashier-sales-table">
      <thead>
        <tr>
          <th>{t('pos.receipt')}</th>
          <th>{t('pos.date')}</th>
          <th>{t('pos.total')}</th>
          <th>{t('pos.payment')}</th>
          <th className="cashier-sales-table__actions" />
        </tr>
      </thead>
      <tbody>
        {isPending ? (
          <tr>
            <td colSpan={5} className="text-center text-muted py-4">
              {t('common.loading')}
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center text-muted py-4">
              {t('pos.noSales')}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick(row)}>
              <td className="cashier-sales-table__receipt">
                {row.receiptNumber}
                {statusBadge(row.status, t)}
              </td>
              <td className="text-muted">
                {row.createdAt ? format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
              </td>
              <td className="cashier-sales-table__amount">{fmt(row.totalAmount)}</td>
              <td>{paymentLabel(row.paymentMethod, t)}</td>
              <td className="cashier-sales-table__actions">
                {row.status !== 'VOIDED' && onReturn && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-warning p-0 text-decoration-none"
                    onClick={(e) => onReturn(row, e)}
                    disabled={voidPending}
                  >
                    {t('pos.return')}
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function SalesSection({
  title,
  rows,
  isPending,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onReturn,
  voidPending,
  onRowClick,
  collapsible,
  expanded,
  onToggleExpanded,
  t,
}) {
  const body = (
    <>
      <div className="cashier-page__table-wrap">
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
    </>
  );

  if (!collapsible) {
    return (
      <div className="cashier-sales-card mb-3">
        <div className="cashier-sales-card__head">{title}</div>
        {body}
      </div>
    );
  }

  return (
    <div className="cashier-sales-card mb-3">
      <button
        type="button"
        className="cashier-sales-card__head w-100 d-flex align-items-center justify-content-between border-0"
        onClick={onToggleExpanded}
      >
        <span>
          {title}
          {!expanded && totalElements > 0 && (
            <span className="text-muted fw-normal ms-2">({totalElements})</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          style={{ transition: 'transform 0.2s' }}
        />
      </button>
      {expanded && body}
    </div>
  );
}

export default function CashierMySalesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { storeId } = useCashierStore();
  const [showOtherSales, setShowOtherSales] = useState(false);
  const [shiftPage, setShiftPage] = useState(0);
  const [otherPage, setOtherPage] = useState(0);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const { data: shift, isPending: shiftLoading } = useQuery({
    queryKey: ['cashier-shift', storeId],
    queryFn: () => cashierShiftApi.current(storeId).then((r) => r.data),
    enabled: !!storeId,
    retry: 1,
  });

  const shiftId = shift?.id;
  const shiftQueryParams = useMemo(
    () => ({ ...buildQueryParams(filters, shiftPage), shiftId }),
    [filters, shiftPage, shiftId]
  );
  const otherQueryParams = useMemo(
    () => ({ ...buildQueryParams(filters, otherPage), excludeShiftId: shiftId }),
    [filters, otherPage, shiftId]
  );

  const { data: shiftSales, isPending: shiftSalesLoading } = useQuery({
    queryKey: ['my-sales', 'shift', shiftQueryParams],
    queryFn: () => saleApi.mySales(shiftQueryParams).then((r) => r.data),
    enabled: !!shiftId,
  });

  const { data: otherSales, isPending: otherSalesLoading } = useQuery({
    queryKey: ['my-sales', 'other', otherQueryParams],
    queryFn: () => saleApi.mySales(otherQueryParams).then((r) => r.data),
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

  const patchFilters = (patch, resetPages = true) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    if (resetPages) {
      setShiftPage(0);
      setOtherPage(0);
    }
  };

  const applyFilters = () => {
    setShiftPage(0);
    setOtherPage(0);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setShiftPage(0);
    setOtherPage(0);
  };

  const shiftRows = shiftSales?.content ?? [];
  const otherRows = otherSales?.content ?? [];
  const shiftTotalPages = shiftSales?.totalPages ?? 0;
  const otherTotalPages = otherSales?.totalPages ?? 0;
  const otherTotal = otherSales?.totalElements ?? 0;

  const shiftOpenedLabel =
    shift?.openedAt != null ? format(new Date(shift.openedAt), 'dd.MM.yyyy HH:mm') : '—';

  return (
    <div className="cashier-page">
      <h1 className="h5 fw-bold mb-3 flex-shrink-0">{t('pos.mySalesTitle')}</h1>

      <SalesFilters
        filters={filters}
        onPatch={patchFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        t={t}
      />

      <div className="cashier-page__scroll">
        {shiftLoading ? (
          <p className="text-muted small">{t('common.loading')}</p>
        ) : !shiftId ? (
          <div className="alert alert-warning mb-0">{t('pos.shiftRequired')}</div>
        ) : (
          <>
            <div className="cashier-sales-shift-banner mb-3 flex-shrink-0">
              <Clock size={18} className="flex-shrink-0 opacity-75" aria-hidden />
              <div>
                <p className="fw-semibold mb-0">{t('pos.currentShiftSales')}</p>
                <p className="small mb-0 opacity-90">
                  {t('pos.shiftOpenedAt', { time: shiftOpenedLabel })}
                  {' · '}
                  {shift?.saleCount ?? 0} {t('pos.shiftSales').toLowerCase()}
                  {' · '}
                  {fmt(shift?.totalAmount)}
                </p>
              </div>
            </div>

            <SalesSection
              title={t('pos.shiftSalesList')}
              rows={shiftRows}
              isPending={shiftSalesLoading}
              page={shiftPage}
              totalPages={shiftTotalPages}
              totalElements={shiftSales?.totalElements ?? 0}
              onPageChange={setShiftPage}
              onReturn={handleReturn}
              voidPending={voidMutation.isPending}
              onRowClick={(row) => navigate(`/receipt/${row.receiptNumber}`)}
              t={t}
            />

            <SalesSection
              title={showOtherSales ? t('pos.hideOtherSales') : t('pos.showOtherSales')}
              rows={otherRows}
              isPending={otherSalesLoading}
              page={otherPage}
              totalPages={otherTotalPages}
              totalElements={otherTotal}
              onPageChange={setOtherPage}
              onReturn={handleReturn}
              voidPending={voidMutation.isPending}
              onRowClick={(row) => navigate(`/receipt/${row.receiptNumber}`)}
              collapsible
              expanded={showOtherSales}
              onToggleExpanded={() => setShowOtherSales((v) => !v)}
              t={t}
            />
          </>
        )}
      </div>
    </div>
  );
}

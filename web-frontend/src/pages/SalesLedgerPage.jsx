// src/pages/SalesLedgerPage.jsx
import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Download, Filter, MoreVertical, Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { saleApi, storeApi } from '../services/api';
import SalesLedgerFiltersDrawer from '../components/reports/SalesLedgerFiltersDrawer';
import SaleFiscalPrintModal from '../components/reports/SaleFiscalPrintModal';

import { fmtMoney } from '../utils/formatMoney';

const defaultFilters = {
  storeId: '',
  paymentSettlement: 'ALL',
  paymentMethod: '',
  saleId: '',
  receiptNumber: '',
  cashierName: '',
  dateFrom: '',
  dateTo: '',
};

function PaymentIcon({ method }) {
  const Icon =
    method === 'CARD' ? CreditCard : method === 'MPESA' ? Smartphone : method === 'MIXED' ? Wallet : Banknote;
  return <Icon size={14} className="text-slate-600 dark:text-slate-400" />;
}

export default function SalesLedgerPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [rowMenu, setRowMenu] = useState(null);
  const [printSaleId, setPrintSaleId] = useState(null);
  const selectAllRef = useRef(null);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const queryParams = useMemo(() => {
    const a = applied;
    return {
      page,
      size: pageSize,
      search: search.trim() || undefined,
      from: a.dateFrom || undefined,
      to: a.dateTo || undefined,
      receiptNumber: a.receiptNumber.trim() || undefined,
      saleId: a.saleId.trim() || undefined,
      cashierName: a.cashierName.trim() || undefined,
      paymentMethod: a.paymentMethod || undefined,
      paymentSettlement: a.paymentSettlement === 'ALL' ? undefined : a.paymentSettlement,
      storeId: a.storeId === '' ? undefined : Number(a.storeId),
    };
  }, [search, page, pageSize, applied]);

  const exportParams = useMemo(() => {
    const a = applied;
    return {
      search: search.trim() || undefined,
      from: a.dateFrom || undefined,
      to: a.dateTo || undefined,
      receiptNumber: a.receiptNumber.trim() || undefined,
      saleId: a.saleId.trim() || undefined,
      cashierName: a.cashierName.trim() || undefined,
      paymentMethod: a.paymentMethod || undefined,
      paymentSettlement: a.paymentSettlement === 'ALL' ? undefined : a.paymentSettlement,
      storeId: a.storeId === '' ? undefined : Number(a.storeId),
    };
  }, [search, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['sales-ledger', queryParams],
    queryFn: () => saleApi.getAll(queryParams).then((r) => r.data),
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) => saleApi.voidSale(id, reason),
    onSuccess: () => {
      toast.success(t('salesLedger.voidSaleSuccess'));
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      setRowMenu(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('salesLedger.voidSaleFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const fromN = total === 0 ? 0 : page * pageSize + 1;
  const toN = Math.min((page + 1) * pageSize, total);

  const paymentLabel = (m) => {
    if (m === 'CARD') return t('sales.paymentCard');
    if (m === 'MPESA') return t('sales.paymentMpesa');
    if (m === 'MIXED') return t('salesLedger.filters.mixed');
    return t('sales.paymentCash');
  };

  const creditAdvanceCell = (row) => {
    const type = row.receiptType;
    if (type !== 'CREDIT' && type !== 'ADVANCE') {
      return <span className="text-slate-400">—</span>;
    }
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {t(`pos.receiptType.${type}`)}
        </span>
        <span className="font-medium text-slate-900 dark:text-white">{fmtMoney(row.totalAmount)}</span>
      </div>
    );
  };

  const fmtAt = (iso) => {
    try {
      return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'yyyy-MM-dd, HH:mm:ss');
    } catch {
      return '—';
    }
  };

  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return [];
    const maxBtns = 5;
    if (totalPages <= maxBtns) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    let start = Math.max(0, page - 2);
    let end = Math.min(totalPages, start + maxBtns);
    start = Math.max(0, end - maxBtns);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [totalPages, page]);

  const showEllipsisBefore = totalPages > 5 && pageButtons.length > 0 && pageButtons[0] > 0;
  const showEllipsisAfter =
    totalPages > 5 && pageButtons.length > 0 && pageButtons[pageButtons.length - 1] < totalPages - 1;

  const handleExportSalesExcel = async () => {
    try {
      const res = await saleApi.exportLines(exportParams);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_ledger_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('salesLedger.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('salesLedger.exportFailed'));
    }
  };

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message ?? t('salesLedger.loadError')}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('salesLedger.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportSalesExcel}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download size={16} />
            {t('salesLedger.export')}
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600"
          >
            <Filter size={16} />
            {t('products.toolbar.filters')}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder={t('salesLedger.searchPh')}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="w-10 px-3 py-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllPage}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-3 py-3">{t('salesLedger.colDateReceipt')}</th>
                <th className="px-3 py-3">{t('salesLedger.colStore')}</th>
                <th className="px-3 py-3">{t('salesLedger.colEmployee')}</th>
                <th className="px-3 py-3 text-right">{t('salesLedger.colTotal')}</th>
                <th className="px-3 py-3 text-right">{t('salesLedger.colCreditAdvance')}</th>
                <th className="px-3 py-3">{t('salesLedger.colPayment')}</th>
                <th className="px-3 py-3 text-right">{t('salesLedger.colGrandTotal')}</th>
                <th className="px-3 py-3 text-right">{t('salesLedger.colReturns')}</th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                    {t('salesLedger.empty')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                      <div>{fmtAt(row.createdAt)}</div>
                      <div className="font-mono text-xs text-slate-500">/ {row.receiptNumber}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.storeName ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.cashierName ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">
                      {fmtMoney(row.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-right">{creditAdvanceCell(row)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <PaymentIcon method={row.paymentMethod} />
                        <span className="text-xs">{paymentLabel(row.paymentMethod)}</span>
                        <span className="text-xs text-slate-500">{fmtMoney(row.amountTendered)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                      {fmtMoney(row.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(row.returnAmount) > 0 ||
                      row.status === 'VOIDED' ||
                      row.status === 'REFUNDED' ? (
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {fmtMoney(row.returnAmount ?? row.totalAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setRowMenu((cur) => (cur?.row?.id === row.id ? null : { row, rect }));
                        }}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t('products.recordsRange', { from: fromN, to: toN, total })}
          </span>
          <span className="text-xs">{t('products.pageSizeLabel', { size: pageSize })}</span>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600"
              >
                {t('common.prev')}
              </button>
              {showEllipsisBefore && (
                <>
                  <button
                    type="button"
                    onClick={() => setPage(0)}
                    className="min-w-[2rem] rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                  >
                    1
                  </button>
                  <span className="px-1">…</span>
                </>
              )}
              {pageButtons.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`min-w-[2rem] rounded border px-2 py-1 text-xs ${
                    page === i
                      ? 'border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              {showEllipsisAfter && (
                <>
                  <span className="px-1">…</span>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages - 1)}
                    className={`min-w-[2rem] rounded border px-2 py-1 text-xs dark:border-slate-600 ${
                      page === totalPages - 1
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-slate-300'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      </div>

      <SalesLedgerFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        stores={stores}
        onReset={() => {
          const f = { ...defaultFilters };
          setFilters(f);
          setApplied(f);
          setPage(0);
        }}
        onApply={() => {
          setApplied({ ...filters });
          setPage(0);
          setFiltersOpen(false);
        }}
      />

      {rowMenu &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[200] cursor-default"
              aria-label="close menu"
              onClick={() => setRowMenu(null)}
            />
            <div
              role="menu"
              className="fixed z-[210] min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
              style={{
                top: `${rowMenu.rect.bottom + 4}px`,
                right: `${window.innerWidth - rowMenu.rect.right}px`,
              }}
            >
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setPrintSaleId(rowMenu.row.id);
                  setRowMenu(null);
                }}
              >
                {t('salesLedger.printFiscal')}
              </button>
              <Link
                to={`/receipt/${rowMenu.row.receiptNumber}`}
                className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => setRowMenu(null)}
              >
                {t('salesLedger.openReceipt')}
              </Link>
              {rowMenu.row.status !== 'VOIDED' && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => {
                    const reason = window.prompt(t('pos.returnReason'), t('pos.returnDefaultReason'));
                    if (reason == null) return;
                    voidMutation.mutate({ id: rowMenu.row.id, reason });
                  }}
                >
                  {t('salesLedger.voidSale')}
                </button>
              )}
            </div>
          </>,
          document.body
        )}

      {printSaleId
        ? createPortal(
            <SaleFiscalPrintModal saleId={printSaleId} onClose={() => setPrintSaleId(null)} />,
            document.body
          )
        : null}
    </div>
  );
}

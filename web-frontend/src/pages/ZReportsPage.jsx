// src/pages/ZReportsPage.jsx
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, MoreVertical, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { zReportApi, storeApi } from '../services/api';
import ZReportFiltersDrawer from '../components/z-reports/ZReportFiltersDrawer';
import ZReportAutoPrint from '../components/z-reports/ZReportAutoPrint';

import { fmtMoney } from '../utils/formatMoney';
import TablePagination from '../components/shared/TablePagination';

const defaultFilters = {
  storeId: '',
  closedFrom: '',
  closedTo: '',
  fiscalCardId: '',
  terminalSerial: '',
};

function fmtDateTime(iso) {
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return '—';
  }
}

export default function ZReportsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [rowMenu, setRowMenu] = useState(null);
  const [printZId, setPrintZId] = useState(null);
  const closeZPrint = useCallback(() => setPrintZId(null), []);
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
      storeId: a.storeId ? Number(a.storeId) : undefined,
      closedFrom: a.closedFrom || undefined,
      closedTo: a.closedTo || undefined,
      fiscalCardId: a.fiscalCardId.trim() || undefined,
      terminalSerial: a.terminalSerial.trim() || undefined,
    };
  }, [search, page, pageSize, applied]);

  const exportParams = useMemo(() => {
    const a = applied;
    return {
      search: search.trim() || undefined,
      storeId: a.storeId ? Number(a.storeId) : undefined,
      closedFrom: a.closedFrom || undefined,
      closedTo: a.closedTo || undefined,
      fiscalCardId: a.fiscalCardId.trim() || undefined,
      terminalSerial: a.terminalSerial.trim() || undefined,
    };
  }, [search, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['z-reports', queryParams],
    queryFn: () => zReportApi.getAll(queryParams).then((r) => r.data),
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

  const handleExportAll = async () => {
    try {
      const res = await zReportApi.exportAll(exportParams);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `z_reports_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('zReports.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('zReports.exportFailed'));
    }
  };

  const handleExportRowSales = async (id) => {
    try {
      const res = await zReportApi.exportSales(id);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `z_report_${id}_sales.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('zReports.exportSalesDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('zReports.exportFailed'));
    }
  };

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message ?? t('zReports.loadError')}
        </div>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
        <p className="font-semibold">{t('zReports.hintTitle')}</p>
        <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">{t('zReports.hintBody')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('zReports.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportAll}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download size={16} />
            {t('zReports.exportAll')}
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
          placeholder={t('zReports.searchPlaceholder')}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
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
                <th className="px-3 py-3">{t('zReports.colFiscalCard')}</th>
                <th className="px-3 py-3">{t('zReports.colDate')}</th>
                <th className="px-3 py-3">{t('zReports.colZNumber')}</th>
                <th className="px-3 py-3 text-right">{t('zReports.colTotal')}</th>
                <th className="px-3 py-3 text-right">{t('zReports.colVat')}</th>
                <th className="px-3 py-3">{t('zReports.colStore')}</th>
                <th className="px-3 py-3">{t('zReports.colTerminalSerial')}</th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                    {t('zReports.empty')}
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
                    <td className="px-3 py-2 font-mono text-xs text-slate-800 dark:text-slate-200">{row.fiscalCardId}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs font-medium text-amber-800 dark:text-amber-200/90">
                        {t('zReports.openedPrefix')} {fmtDateTime(row.openedAt)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t('zReports.closedPrefix')} {fmtDateTime(row.closedAt)}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{row.zNumber}</td>
                    <td className="px-3 py-2 text-right text-base font-bold text-slate-900 dark:text-white">
                      {fmtMoney(row.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{fmtMoney(row.vatAmount)}</td>
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.storeName}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{row.terminalSerial ?? '—'}</td>
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

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ZReportFiltersDrawer
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
              className="fixed z-[210] min-w-[280px] max-w-[90vw] rounded-lg border border-slate-200 bg-white py-2 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
              style={{
                top: `${rowMenu.rect.bottom + 4}px`,
                right: `${window.innerWidth - rowMenu.rect.right}px`,
              }}
            >
              <div className="flex flex-wrap gap-1 px-2">
                <button
                  type="button"
                  className="flex-1 rounded px-2 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
                  onClick={() => {
                    handleExportRowSales(rowMenu.row.id);
                    setRowMenu(null);
                  }}
                >
                  {t('zReports.rowExportSales')}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded px-2 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
                  onClick={() => {
                    setPrintZId(rowMenu.row.id);
                    setRowMenu(null);
                  }}
                >
                  {t('receipt.print')}
                </button>
              </div>
            </div>
          </>,
          document.body
        )}

      {printZId
        ? createPortal(<ZReportAutoPrint zReportId={printZId} onClose={closeZPrint} />, document.body)
        : null}
    </div>
  );
}

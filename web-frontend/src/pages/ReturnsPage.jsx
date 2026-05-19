// src/pages/ReturnsPage.jsx
import { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Search, Filter, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { returnApi, storeApi } from '../services/api';
import ReturnsFiltersDrawer from '../components/reports/ReturnsFiltersDrawer';
import TableRowActionsMenu from '../components/shared/TableRowActionsMenu';
import ReturnDetailModal from '../components/reports/ReturnDetailModal';
import ReturnReasonModal from '../components/reports/ReturnReasonModal';

import { fmtMoney } from '../utils/formatMoney';
import TablePagination from '../components/shared/TablePagination';

const defaultFilters = {
  storeId: '',
  cashierName: '',
  dateFrom: '',
  dateTo: '',
};

export default function ReturnsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailReason, setDetailReason] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [exporting, setExporting] = useState(false);
  const qc = useQueryClient();

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      fiscalSearch: search.trim() || undefined,
      from: applied.dateFrom || undefined,
      to: applied.dateTo || undefined,
      cashierName: applied.cashierName.trim() || undefined,
      storeId: applied.storeId === '' ? undefined : Number(applied.storeId),
    }),
    [search, page, pageSize, applied]
  );

  const exportParams = useMemo(
    () => ({
      fiscalSearch: search.trim() || undefined,
      from: applied.dateFrom || undefined,
      to: applied.dateTo || undefined,
      cashierName: applied.cashierName.trim() || undefined,
      storeId: applied.storeId === '' ? undefined : Number(applied.storeId),
    }),
    [search, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['returns', queryParams],
    queryFn: () => returnApi.getAll(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
  });


  const updateReasonMutation = useMutation({
    mutationFn: ({ id, reason }) => returnApi.updateReason(id, { reason }),
    onSuccess: () => {
      toast.success(t('returnsModule.updateReasonSuccess'));
      qc.invalidateQueries({ queryKey: ['returns'] });
      setEditRow(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('returnsModule.updateReasonFailed')),
  });

  const cancelReturnMutation = useMutation({
    mutationFn: (id) => returnApi.delete(id),
    onSuccess: () => {
      toast.success(t('returnsModule.cancelReturnSuccess'));
      qc.invalidateQueries({ queryKey: ['returns'] });
      setMenuOpenId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('returnsModule.cancelReturnFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const fmtAt = useCallback(
    (iso) => {
      try {
        return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'dd.MM.yyyy HH:mm');
      } catch {
        return '—';
      }
    },
    []
  );

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const res = await returnApi.exportExcel(exportParams);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = applied.dateFrom && applied.dateTo
        ? `${applied.dateFrom}_${applied.dateTo}`
        : new Date().toISOString().slice(0, 10);
      a.download = `returns_report_${suffix}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('returnsModule.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('returnsModule.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [exportParams, applied.dateFrom, applied.dateTo, t]);

  const loading = isPending;
  const showEmptyHint = !loading && !isError && rows.length === 0;

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.status === 403
            ? t('returnsModule.forbidden')
            : error?.response?.data?.message ?? error?.message ?? t('returnsModule.loadError')}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('returnsModule.title')}</h1>
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Download size={16} />
          {exporting ? t('returnsModule.exporting') : t('returnsModule.downloadExcel')}
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={t('returnsModule.searchPh')}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600"
        >
          <Filter size={16} />
          {t('products.toolbar.filters')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-4 py-3">{t('returnsModule.colDate')}</th>
                <th className="px-4 py-3">{t('returnsModule.colFiscal')}</th>
                <th className="px-4 py-3 text-right">{t('returnsModule.colAmount')}</th>
                <th className="px-4 py-3 text-right">{t('returnsModule.colPositions')}</th>
                <th className="px-4 py-3">{t('returnsModule.colStore')}</th>
                <th className="px-4 py-3">{t('returnsModule.colReason')}</th>
                <th className="px-4 py-3 text-right">{t('returnsModule.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : showEmptyHint ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <div className="m-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                      <Info className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" size={20} />
                      <p>{t('returnsModule.emptyHint')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{fmtAt(row.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {row.fiscalModuleId}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {fmtMoney(row.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{row.positionsCount}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{row.storeName ?? '—'}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-700 dark:text-slate-300" title={row.reason || ''}>
                      {row.reason?.trim() ? row.reason : '—'}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <TableRowActionsMenu
                        open={menuOpenId === row.id}
                        onOpenChange={(open) => setMenuOpenId(open ? row.id : null)}
                        actions={[
                          {
                            label: t('returnsModule.viewInfo'),
                            onClick: () => {
                              setDetailId(row.id);
                              setDetailReason(row.reason ?? '');
                            },
                          },
                          {
                            label: t('returnsModule.editReason'),
                            onClick: () => setEditRow(row),
                          },
                          ...(row.status === 'VOIDED'
                            ? [
                                {
                                  label: t('returnsModule.cancelReturn'),
                                  danger: true,
                                  onClick: () => {
                                    if (!window.confirm(t('returnsModule.deleteConfirm'))) return;
                                    cancelReturnMutation.mutate(row.id);
                                  },
                                },
                              ]
                            : []),
                        ]}
                      />
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

      <ReturnsFiltersDrawer
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

      <ReturnDetailModal
        open={!!detailId}
        returnId={detailId}
        reasonPreview={detailReason}
        onClose={() => {
          setDetailId(null);
          setDetailReason('');
        }}
      />

      <ReturnReasonModal
        open={!!editRow}
        initialReason={editRow?.reason}
        saving={updateReasonMutation.isPending}
        onClose={() => setEditRow(null)}
        onSave={(reason) => updateReasonMutation.mutate({ id: editRow.id, reason })}
      />
    </div>
  );
}

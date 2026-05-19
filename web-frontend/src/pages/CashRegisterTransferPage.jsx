// src/pages/CashRegisterTransferPage.jsx
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { cashRegisterApi } from '../services/api';
import CashTransferFiltersDrawer from '../components/cash-registers/CashTransferFiltersDrawer';
import TablePagination from '../components/shared/TablePagination';

import { fmtMoney } from '../utils/formatMoney';

const defaultFilters = {
  registerNumber: '',
  closedFrom: '',
  closedTo: '',
};

function fmtDateTime(iso) {
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return '—';
  }
}

export default function CashRegisterTransferPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [exporting, setExporting] = useState(false);

  const queryParams = useMemo(() => {
    const reg = applied.registerNumber.trim();
    return {
      page,
      size: pageSize,
      search: search.trim() || undefined,
      registerNumber: reg ? Number(reg) : undefined,
      closedFrom: applied.closedFrom || undefined,
      closedTo: applied.closedTo || undefined,
    };
  }, [search, page, pageSize, applied]);

  const exportParams = useMemo(() => {
    const reg = applied.registerNumber.trim();
    return {
      search: search.trim() || undefined,
      registerNumber: reg ? Number(reg) : undefined,
      closedFrom: applied.closedFrom || undefined,
      closedTo: applied.closedTo || undefined,
    };
  }, [search, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['cash-registers-transfers', queryParams],
    queryFn: () => cashRegisterApi.getTransfers(queryParams).then((r) => r.data),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const res = await cashRegisterApi.exportTransfers(exportParams);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix =
        applied.closedFrom && applied.closedTo
          ? `${applied.closedFrom}_${applied.closedTo}`
          : new Date().toISOString().slice(0, 10);
      a.download = `cash_transfer_${suffix}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('cashRegisters.transferExportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('cashRegisters.transferExportFailed'));
    } finally {
      setExporting(false);
    }
  }, [exportParams, applied.closedFrom, applied.closedTo, t]);

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message ?? t('cashRegisters.transferLoadError')}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('cashRegisters.transferTitle')}</h1>
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={exporting}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Download size={16} />
          {exporting ? t('cashRegisters.transferExporting') : t('cashRegisters.transferExport')}
        </button>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
        <p className="font-semibold">{t('cashRegisters.transferHintTitle')}</p>
        <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">{t('cashRegisters.transferHintBody')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={t('cashRegisters.transferSearchPlaceholder')}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600"
        >
          <Filter size={16} />
          {t('products.toolbar.filters')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                  <div className="leading-tight">{t('cashRegisters.transferGroupStoreRegister')}</div>
                </th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                  <div className="leading-tight">{t('cashRegisters.transferGroupOpenClose')}</div>
                </th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" rowSpan={2}>
                  <div className="flex h-full items-center justify-center">{t('cashRegisters.transferColCashier')}</div>
                </th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                  <div className="leading-tight">{t('cashRegisters.transferGroupSales')}</div>
                </th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={3}>
                  <div className="leading-tight">{t('cashRegisters.transferGroupPayments')}</div>
                </th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                  <div className="leading-tight">{t('cashRegisters.transferGroupReturns')}</div>
                </th>
                <th className="px-2 py-2" colSpan={3}>
                  <div className="leading-tight">{t('cashRegisters.transferGroupReturnMethods')}</div>
                </th>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColStore')}</th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColRegister')}</th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColOpened')}</th>
                <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColClosed')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColSaleQty')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColSaleTotal')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColPayCash')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColPayCard')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColPayNonCash')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetQty')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetTotal')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetCash')}</th>
                <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetCard')}</th>
                <th className="px-2 py-2 text-right">{t('cashRegisters.transferColRetNonCash')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={15} className="px-4 py-10 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-10 text-center text-slate-500">
                    {t('cashRegisters.transferEmptyBanner')}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.zReportId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="max-w-[180px] truncate border-r border-slate-100 px-2 py-2 text-slate-900 dark:border-slate-800 dark:text-slate-100">
                      {r.storeName}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {r.registerNumber != null ? r.registerNumber : '—'}
                    </td>
                    <td className="whitespace-nowrap border-r border-slate-100 px-2 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      {fmtDateTime(r.openedAt)}
                    </td>
                    <td className="whitespace-nowrap border-r border-slate-100 px-2 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      {fmtDateTime(r.closedAt)}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {r.cashierName}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {r.salesCount}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums font-medium text-slate-900 dark:border-slate-800 dark:text-white">
                      {fmtMoney(r.totalAmount)}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {fmtMoney(r.paymentCash)}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {fmtMoney(r.paymentCard)}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {fmtMoney(r.paymentNonCash)}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {r.returnsCount}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {fmtMoney(r.returnsTotalAmount)}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {fmtMoney(r.returnsCash)}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      {fmtMoney(r.returnsCard)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                      {fmtMoney(r.returnsNonCash)}
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


      <CashTransferFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onApply={() => {
          setApplied(filters);
          setPage(0);
          setFiltersOpen(false);
        }}
        onReset={() => {
          setFilters(defaultFilters);
          setApplied(defaultFilters);
          setPage(0);
        }}
      />
    </div>
  );
}

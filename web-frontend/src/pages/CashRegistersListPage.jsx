// src/pages/CashRegistersListPage.jsx
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { cashRegisterApi } from '../services/api';
import CashRegistersFiltersDrawer from '../components/cash-registers/CashRegistersFiltersDrawer';
import CashRegisterDetailsModal from '../components/cash-registers/CashRegisterDetailsModal';

const defaultFilters = {
  equipmentModel: '',
  equipmentSerial: '',
  fiscalCardId: '',
};

const PAGE_SIZE_OPTIONS = [10, 14, 20, 50];

export default function CashRegistersListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      equipmentModel: applied.equipmentModel.trim() || undefined,
      equipmentSerial: applied.equipmentSerial.trim() || undefined,
      fiscalCardId: applied.fiscalCardId.trim() || undefined,
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['cash-registers', queryParams],
    queryFn: () => cashRegisterApi.getAll(queryParams).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => cashRegisterApi.toggleStatus(id).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-config-form-options'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers-pick'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-detail', updated.id] });
      toast.success(
        updated.status === 'ACTIVE' ? t('cashRegisters.statusToggledOn') : t('cashRegisters.statusToggledOff')
      );
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? t('cashRegisters.statusToggleFailed')),
    onSettled: () => setTogglingId(null),
  });

  const handleToggleStatus = (e, row) => {
    e.stopPropagation();
    setTogglingId(row.id);
    toggleMutation.mutate(row.id);
  };

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;

  const fromN = total === 0 ? 0 : page * pageSize + 1;
  const toN = Math.min((page + 1) * pageSize, total);

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

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message ?? t('cashRegisters.loadError')}
        </div>
      )}

      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('cashRegisters.title')}</h1>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
        <p className="font-semibold">{t('cashRegisters.listHintTitle')}</p>
        <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">{t('cashRegisters.listHintBody')}</p>
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
            placeholder={t('cashRegisters.searchPlaceholder')}
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
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-4 py-3">{t('cashRegisters.colStore')}</th>
                <th className="px-4 py-3">{t('cashRegisters.colRegisterNo')}</th>
                <th className="px-4 py-3">{t('cashRegisters.colModel')}</th>
                <th className="px-4 py-3">{t('cashRegisters.colSerial')}</th>
                <th className="px-4 py-3">{t('cashRegisters.colFiscal')}</th>
                <th className="w-24 px-4 py-3 text-center">{t('cashRegisters.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {t('cashRegisters.empty')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={() => setDetailId(row.id)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.storeName}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{row.registerNumber}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.equipmentModel ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {row.equipmentSerial ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {row.fiscalCardId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          disabled={togglingId === row.id}
                          title={t('cashRegisters.statusToggleActive')}
                          onClick={(e) => handleToggleStatus(e, row)}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/80 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                        >
                          <Play size={12} className="shrink-0" strokeWidth={2.5} aria-hidden />
                          {t('cashRegisters.statusActive')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={togglingId === row.id}
                          title={t('cashRegisters.statusToggleInactive')}
                          onClick={(e) => handleToggleStatus(e, row)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Pause size={12} className="shrink-0" aria-hidden />
                          {t('cashRegisters.statusInactive')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          <span>{t('products.recordsRange', { from: fromN, to: toN, total })}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-500">{t('cashRegisters.pageSizePrefix')}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1 sm:flex-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600"
            >
              {t('common.prev')}
            </button>
            {(totalPages <= 1 ? [0] : pageButtons).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => totalPages > 1 && setPage(i)}
                disabled={totalPages <= 1}
                className={`min-w-[2rem] rounded border px-2 py-1 text-xs ${
                  page === i
                    ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-600"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      <CashRegisterDetailsModal registerId={detailId} onClose={() => setDetailId(null)} />

      <CashRegistersFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
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
    </div>
  );
}

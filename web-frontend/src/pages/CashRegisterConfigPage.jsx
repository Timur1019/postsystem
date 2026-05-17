// src/pages/CashRegisterConfigPage.jsx
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search, Filter, Plus, Lock, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { cashRegisterApi, cashRegisterConfigApi, storeApi } from '../services/api';
import CashRegisterConfigFiltersDrawer from '../components/cash-registers/CashRegisterConfigFiltersDrawer';
import CashRegisterConfigAddModal from '../components/cash-registers/CashRegisterConfigAddModal';

const defaultFilters = {
  storeId: '',
  equipmentSerial: '',
};

const PAGE_SIZE_OPTIONS = [10, 14, 20, 50];

function fmtCount(n) {
  return n === 0 ? '—' : String(n);
}

export default function CashRegisterConfigPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      storeId: applied.storeId ? Number(applied.storeId) : undefined,
      equipmentSerial: applied.equipmentSerial.trim() || undefined,
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['cash-register-configs', queryParams],
    queryFn: () => cashRegisterConfigApi.getAll(queryParams).then((r) => r.data),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const { data: serials = [] } = useQuery({
    queryKey: ['cash-register-serials'],
    queryFn: () => cashRegisterApi.getEquipmentSerials().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cashRegisterConfigApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-configs'] });
      toast.success(t('cashRegisters.configDeleted'));
    },
    onError: (e) => {
      const msg = e?.response?.data?.message ?? e?.message ?? t('cashRegisters.configDeleteFailed');
      toast.error(msg);
    },
  });

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

  const handleDelete = (row) => {
    if (row.lockedDefault) return;
    if (!window.confirm(t('cashRegisters.configDeleteConfirm', { name: row.name }))) return;
    deleteMutation.mutate(row.id);
  };

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message ?? t('cashRegisters.configLoadError')}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('cashRegisters.configTitle')}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Plus size={16} />
            {t('cashRegisters.configAdd')}
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600"
          >
            <Filter size={16} />
            {t('products.toolbar.filters')}
          </button>
        </div>
      </div>

      <div className="relative min-w-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder={t('cashRegisters.configSearchPlaceholder')}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-4 py-3">{t('cashRegisters.configColName')}</th>
                <th className="px-4 py-3">{t('cashRegisters.configColStores')}</th>
                <th className="px-4 py-3">{t('cashRegisters.configColRegisters')}</th>
                <th className="px-4 py-3">{t('cashRegisters.configColCategories')}</th>
                <th className="w-16 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    {t('cashRegisters.configEmpty')}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <span className="inline-flex items-center gap-2">
                        {r.lockedDefault && <Lock size={14} className="shrink-0 text-slate-500" aria-hidden />}
                        {r.name}
                      </span>
                      {r.lockedDefault && (
                        <div className="mt-0.5 text-xs font-normal text-slate-500">{t('cashRegisters.configDefaultLocked')}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200">{fmtCount(r.storeCount)}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200">{fmtCount(r.registerCount)}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200">{fmtCount(r.categoryCount)}</td>
                    <td className="px-2 py-3 text-right">
                      {!r.lockedDefault && (
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                          title={t('cashRegisters.configDelete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>{t('cashRegisters.transferPageRange', { from: fromN, to: toN, total })}</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">{t('cashRegisters.pageSizePrefix')}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-600"
                >
                  ‹
                </button>
                {pageButtons.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`min-w-[2rem] rounded border px-2 py-1 ${
                      i === page
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-600"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CashRegisterConfigFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        stores={stores}
        serials={serials}
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

      <CashRegisterConfigAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['cash-register-configs'] })}
      />
    </div>
  );
}

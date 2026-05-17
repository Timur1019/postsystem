// src/pages/SuppliersPage.jsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Plus, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { supplierApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import SupplierFiltersDrawer from '../components/suppliers/SupplierFiltersDrawer';
import SupplierModal from '../components/suppliers/SupplierModal';

const canManage = (role) => role === 'ADMIN' || role === 'MANAGER';

const defaultFilters = { createdOn: '' };

export default function SuppliersPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const manage = canManage(user?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      createdOn: applied.createdOn || undefined,
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['suppliers', queryParams],
    queryFn: () => supplierApi.getAll(queryParams).then((r) => r.data),
    placeholderData: { content: [], totalPages: 0, totalElements: 0 },
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;
  const showEmptyHint = !loading && !isError && rows.length === 0;

  const fmtDate = (iso) => {
    try {
      return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'dd.MM.yyyy');
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message ?? t('suppliersModule.loadError')}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('suppliersModule.title')}</h1>
        {manage && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Plus size={16} />
            {t('suppliersModule.add')}
          </button>
        )}
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
            placeholder={t('suppliersModule.searchPh')}
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
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                <th className="px-4 py-3">{t('suppliersModule.colDate')}</th>
                <th className="px-4 py-3">{t('suppliersModule.colName')}</th>
                <th className="px-4 py-3">{t('suppliersModule.colTax')}</th>
                <th className="px-4 py-3">{t('suppliersModule.colAddress')}</th>
                <th className="px-4 py-3">{t('suppliersModule.colEmail')}</th>
                <th className="px-4 py-3">{t('suppliersModule.colPhone')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    {t('common.loading')}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/80">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(s.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{s.taxId}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.address ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.email ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.phone ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {showEmptyHint && (
          <div className="flex items-start gap-3 border-t border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100">
            <Info size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>{t('suppliersModule.empty')}</span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>
            {t('products.recordsRange', {
              from: page * pageSize + (rows.length ? 1 : 0),
              to: page * pageSize + rows.length,
              total,
            })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600"
            >
              {t('common.prev')}
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      <SupplierFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(defaultFilters);
          setApplied(defaultFilters);
          setPage(0);
          setFiltersOpen(false);
        }}
        onApply={() => {
          setApplied(filters);
          setPage(0);
          setFiltersOpen(false);
        }}
      />

      <SupplierModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

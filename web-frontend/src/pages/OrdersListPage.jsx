// src/pages/OrdersListPage.jsx
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, Download, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { storeApi, orderApi } from '../services/api';
import OrdersFiltersDrawer from '../components/orders/OrdersFiltersDrawer';
import OrderAddWizard from '../components/orders/OrderAddWizard';
import { fmtMoney } from '../utils/formatMoney';

const defaultFilters = {
  externalNumber: '',
  clientName: '',
  address: '',
  courierId: '',
  status: '',
  createdFrom: '',
  createdTo: '',
};

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd HH:mm');
  } catch {
    return '—';
  }
}

const STATUS_LABELS = {
  NEW: 'orders.statusNew',
  DELIVERED: 'orders.statusDelivered',
  COMPLETED: 'orders.statusDone',
  CANCELLED: 'orders.statusCancelled',
};

export default function OrdersListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [addOpen, setAddOpen] = useState(false);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const queryParams = useMemo(() => {
    const a = applied;
    return {
      page: 0,
      size: 50,
      search: appliedSearch.trim() || undefined,
      externalNumber: a.externalNumber.trim() || undefined,
      clientName: a.clientName.trim() || undefined,
      address: a.address.trim() || undefined,
      courierId: a.courierId.trim() || undefined,
      status: a.status.trim() || undefined,
      createdFrom: a.createdFrom || undefined,
      createdTo: a.createdTo || undefined,
    };
  }, [appliedSearch, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['orders', queryParams],
    queryFn: () => orderApi.getAll(queryParams).then((r) => r.data),
  });

  const rows = data?.content ?? [];
  const loading = isPending;

  const onExport = () => {
    toast(t('orders.exportSoon'), { icon: 'ℹ️' });
  };

  const statusLabel = (code) => (code && STATUS_LABELS[code] ? t(STATUS_LABELS[code]) : code ?? '—');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('orders.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <Plus size={18} />
            {t('orders.add')}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <Download size={18} />
            {t('orders.export')}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setAppliedSearch(search.trim());
                }
              }}
              placeholder={t('orders.searchPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{t('orders.searchHint')}</p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            <Filter size={18} />
            {t('orders.filters')}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
        <span className="mr-1.5 inline-block text-sky-600 dark:text-sky-400">ⓘ</span>
        {t('orders.infoEditRule')}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" disabled className="rounded border-slate-300" aria-label="select" />
                </th>
                <th className="px-3 py-3">{t('orders.colOrderDate')}</th>
                <th className="px-3 py-3">{t('orders.colReceiptSale')}</th>
                <th className="px-3 py-3">{t('orders.colExternal')}</th>
                <th className="px-3 py-3">{t('orders.colPayment')}</th>
                <th className="px-3 py-3">{t('orders.colClient')}</th>
                <th className="px-3 py-3">{t('orders.colCourier')}</th>
                <th className="px-3 py-3 text-right">{t('orders.colTotal')}</th>
                <th className="px-3 py-3">{t('orders.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-red-600 dark:text-red-400">
                    {error?.response?.data?.message ?? error?.message ?? t('orders.loadError')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-0">
                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-6 text-center text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
                      {t('orders.emptyBanner')}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3">
                      <input type="checkbox" disabled className="rounded border-slate-300" aria-label="select" />
                    </td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                      <div className="font-medium">{row.id}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(row.createdAt)}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                      <div>{row.receiptNumber ?? '—'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {row.receiptAt ? fmtDateTime(row.receiptAt) : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.externalNumber ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.paymentMethod ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.clientName ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.courierName ?? '—'}</td>
                    <td className="px-3 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {fmtMoney(row.totalAmount)}
                    </td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{statusLabel(row.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrdersFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onApply={() => {
          setApplied({ ...filters });
          setFiltersOpen(false);
        }}
        onReset={() => {
          setFilters(defaultFilters);
          setApplied(defaultFilters);
        }}
      />

      <OrderAddWizard
        open={addOpen}
        onClose={() => setAddOpen(false)}
        stores={stores}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
      />
    </div>
  );
}

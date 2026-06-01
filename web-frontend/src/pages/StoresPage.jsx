// src/pages/StoresPage.jsx
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, CheckCircle2, Circle } from 'lucide-react';
import TableRowActionsMenu from '../components/shared/TableRowActionsMenu';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi } from '../services/api';
import StoreFormModal from '../components/stores/StoreFormModal';

const PAGE_SIZE_OPTIONS = [10, 14, 20, 50];

export default function StoresPage({ showCompanySelect = false, companyIdFilter, companies = [] }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuId, setMenuId] = useState(null);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      companyId: companyIdFilter,
    }),
    [search, page, pageSize, companyIdFilter]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['stores-manage', queryParams],
    queryFn: () => storeApi.getManaged(queryParams).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? storeApi.update(editing.id, payload) : storeApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      toast.success(editing ? t('stores.updated') : t('stores.created'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => storeApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      toast.success(t('stores.updated'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['companies-all'] });
      toast.success(t('stores.deleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.deleteFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const fromN = total === 0 ? 0 : page * pageSize + 1;
  const toN = Math.min((page + 1) * pageSize, total);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
    setMenuId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stores.title')}</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <Plus size={16} />
          {t('stores.add')}
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder={t('stores.searchPlaceholder')}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-4 py-3 font-medium">{t('stores.colName')}</th>
              <th className="px-4 py-3 font-medium">{t('stores.colAddress')}</th>
              <th className="px-4 py-3 font-medium">{t('stores.colPhone')}</th>
              <th className="px-4 py-3 font-medium">{t('stores.colActive')}</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('stores.empty')}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-md">{row.address || '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.phone || '—'}</td>
                <td className="px-4 py-3">
                  {row.active
                    ? <CheckCircle2 size={18} className="text-emerald-500" />
                    : <Circle size={18} className="text-slate-400" />}
                </td>
                <td className="px-4 py-3">
                  <TableRowActionsMenu
                    open={menuId === row.id}
                    onOpenChange={(next) => setMenuId(next ? row.id : null)}
                    actions={[
                      { label: t('common.edit'), onClick: () => openEdit(row) },
                      {
                        label: row.active ? t('stores.deactivate') : t('stores.activate'),
                        onClick: () => toggleMutation.mutate(row.id),
                      },
                      {
                        label: t('common.delete'),
                        danger: true,
                        onClick: () => {
                          if (window.confirm(t('stores.deleteConfirm', { name: row.name }))) {
                            deleteMutation.mutate(row.id);
                          }
                        },
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>{t('stores.range', { from: fromN, to: toN, total })}</span>
        <div className="flex items-center gap-2">
          <span>{t('stores.pageSize')}</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button type="button" disabled={page <= 0} onClick={() => setPage((p) => p - 1)} className="rounded border px-2 py-1 disabled:opacity-40">{t('common.prev')}</button>
          <span className="rounded bg-emerald-500 px-2 py-1 text-white">{page + 1}</span>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-2 py-1 disabled:opacity-40">{t('common.next')}</button>
        </div>
      </div>

      <StoreFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={(payload) => saveMutation.mutate(payload)}
        isPending={saveMutation.isPending}
        initial={editing}
        showCompanySelect={showCompanySelect}
        companies={companies}
      />
    </div>
  );
}

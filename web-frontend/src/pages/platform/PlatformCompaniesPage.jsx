// src/pages/platform/PlatformCompaniesPage.jsx
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X } from 'lucide-react';
import TableRowActionsMenu from '../../components/shared/TableRowActionsMenu';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi } from '../../services/api';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
  focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

const PAGE_SIZE = 14;

export default function PlatformCompaniesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', legalName: '', tin: '', address: '', phone: '', active: true,
  });
  const [menuId, setMenuId] = useState(null);

  const params = useMemo(() => ({ page, size: PAGE_SIZE, search: search.trim() || undefined }), [page, search]);

  const { data, isPending } = useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyApi.getAll(params).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const { name, legalName, tin, address, phone, active } = form;
      const payload = { name, legalName, tin, address, phone, active };
      return editing ? companyApi.update(editing.id, payload) : companyApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(t('platform.companySaved'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(t('platform.companyDeleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const fromN = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toN = Math.min((page + 1) * PAGE_SIZE, total);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', legalName: '', tin: '', address: '', phone: '', active: true });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      legalName: row.legalName ?? '',
      tin: row.tin ?? '',
      address: row.address ?? '',
      phone: row.phone ?? '',
      active: row.active,
    });
    setModalOpen(true);
    setMenuId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('platform.companiesTitle')}</h1>
        <button type="button" onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <Plus size={16} />{t('platform.addCompany')}
        </button>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder={t('platform.companySearch')}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
              <th className="px-4 py-3">{t('platform.colName')}</th>
              <th className="px-4 py-3">{t('platform.colLoginCode')}</th>
              <th className="px-4 py-3">{t('platform.colStores')}</th>
              <th className="px-4 py-3">{t('common.status')}</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {isPending ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 font-mono text-xs tracking-wide text-slate-600 dark:text-slate-400">
                  {row.loginCode || '—'}
                </td>
                <td className="px-4 py-3">{row.storeCount}</td>
                <td className="px-4 py-3">{row.active ? t('common.active') : t('common.inactive')}</td>
                <td className="px-4 py-3">
                  <TableRowActionsMenu
                    open={menuId === row.id}
                    onOpenChange={(next) => setMenuId(next ? row.id : null)}
                    actions={[
                      { label: t('common.edit'), onClick: () => openEdit(row) },
                      {
                        label: t('common.delete'),
                        danger: true,
                        onClick: () => {
                          if (window.confirm(t('platform.deleteCompanyConfirm'))) {
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
      <p className="text-sm text-slate-500">{t('stores.range', { from: fromN, to: toN, total })}</p>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-5 dark:bg-slate-900 dark:border-slate-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? t('platform.editCompany') : t('platform.addCompany')}</h2>
              <button type="button" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            {!editing ? (
              <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                {t('platform.field_loginCodeAutoHint')}
              </p>
            ) : (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500">{t('platform.field_loginCode')}</p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-slate-900 dark:text-white">
                  {editing.loginCode || '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500">{t('platform.field_loginCodeReadonly')}</p>
              </div>
            )}
            {['name', 'legalName', 'tin', 'phone'].map((field) => (
              <div key={field} className="mb-3">
                <label className="mb-1 block text-xs text-slate-500">{t(`platform.field_${field}`)}</label>
                <input
                  className={inputCls}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                />
              </div>
            ))}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-slate-500">{t('platform.field_address')}</label>
              <textarea className={inputCls} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border py-2">{t('common.cancel')}</button>
              <button type="button" disabled={!form.name.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate()} className="flex-1 rounded-lg bg-emerald-500 py-2 text-white font-semibold">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

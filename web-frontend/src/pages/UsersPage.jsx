// src/pages/UsersPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, CheckCircle2, Circle } from 'lucide-react';
import TableRowActionsMenu from '../components/shared/TableRowActionsMenu';
import { useTranslation } from 'react-i18next';
import { userApi } from '../services/api';
import UserFormModal from '../components/users/UserFormModal';
const roleBadge = {
  ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  MANAGER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  CASHIER: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

export default function UsersPage({ mode = 'tenant' }) {
  const isPlatform = mode === 'platform';
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [formMode, setFormMode] = useState(null);
  const [menuId, setMenuId] = useState(null);

  const modalOpen = formMode !== null;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', mode],
    queryFn: () => userApi.getAll().then((r) => r.data),
  });

  const { mutate: toggleUser } = useMutation({
    mutationFn: (id) => userApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.updated'));
      setMenuId(null);
    },
  });

  const openCreate = () => {
    setMenuId(null);
    setFormMode('create');
  };
  const openEdit = (row) => {
    setMenuId(null);
    setFormMode({ type: 'edit', user: row });
  };
  const closeModal = () => setFormMode(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isPlatform ? t('platform.usersTitle') : t('users.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.systemUsers', { count: users.length })}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          <Plus size={16} />
          {t('users.add')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-4 py-3 font-medium">{t('users.colUser')}</th>
              <th className="px-4 py-3 font-medium">{t('users.colUsername')}</th>
              {isPlatform && <th className="px-4 py-3 font-medium">{t('users.colCompany')}</th>}
              <th className="px-4 py-3 font-medium">{t('users.colStores')}</th>
              <th className="px-4 py-3 font-medium">{t('users.colRole')}</th>
              <th className="px-4 py-3 font-medium">{t('users.colActive')}</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={isPlatform ? 7 : 6} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{user.username}</td>
                  {isPlatform && <td className="px-4 py-3">{user.companyName || '—'}</td>}
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {user.storeNames?.length ? user.storeNames.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${roleBadge[user.role] ?? ''}`}>
                      {t(`roles.${user.role}`, user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.active
                      ? <CheckCircle2 size={18} className="text-emerald-500" />
                      : <Circle size={18} className="text-slate-400" />}
                  </td>
                  <td className="px-4 py-3">
                    <TableRowActionsMenu
                      open={menuId === user.id}
                      onOpenChange={(next) => setMenuId(next ? user.id : null)}
                      actions={[
                        { label: t('common.edit'), onClick: () => openEdit(user) },
                        {
                          label: user.active ? t('users.deactivate') : t('users.activate'),
                          onClick: () => toggleUser(user.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={closeModal}
        isPlatform={isPlatform}
        mode={formMode === 'create' ? 'create' : 'edit'}
        editingUser={formMode?.type === 'edit' ? formMode.user : undefined}
      />
    </div>
  );
}

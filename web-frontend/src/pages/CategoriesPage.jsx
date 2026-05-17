// src/pages/CategoriesPage.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Tags, MoreVertical } from 'lucide-react';
import { categoryApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import CategoryModal from '../components/categories/CategoryModal';

const canManage = (role) => role === 'ADMIN' || role === 'MANAGER';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const manage = canManage(user?.role);

  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });

  useEffect(() => {
    if (!rowMenu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setRowMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rowMenu]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('categories.title')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('categories.subtitle', { count: categories.length })}</p>
        </div>
        {manage && (
          <button
            type="button"
            onClick={() => {
              setEditCategory(null);
              setCreateOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
          >
            <Plus size={16} />
            {t('categories.add')}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-800 dark:text-slate-500">
                <th className="px-4 py-3 font-medium w-24">{t('categories.colId')}</th>
                <th className="px-4 py-3 font-medium">{t('categories.colName')}</th>
                <th className="px-4 py-3 font-medium">{t('categories.colDescription')}</th>
                {manage && <th className="px-4 py-3 font-medium w-12 text-right" aria-label={t('categories.actions')} />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={manage ? 4 : 3} className="px-4 py-8 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={manage ? 4 : 3} className="px-4 py-12 text-center text-slate-500">
                    <Tags className="mx-auto mb-2 opacity-40" size={32} />
                    {t('categories.none')}
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-500">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.description ?? '—'}</td>
                    {manage && (
                      <td className="px-2 py-3 text-right">
                        <button
                          type="button"
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setRowMenu((cur) =>
                              cur?.category?.id === c.id ? null : { category: c, rect }
                            );
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(createOpen || editCategory) && (
        <CategoryModal
          key={editCategory?.id ?? 'new'}
          category={editCategory}
          onClose={() => {
            setCreateOpen(false);
            setEditCategory(null);
          }}
          onSaved={() => {
            setCreateOpen(false);
            setEditCategory(null);
          }}
        />
      )}

      {deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('categories.deleteTitle')}</h2>
              <button
                type="button"
                onClick={() => setDeleteCategory(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
              {t('categories.deleteHint', { name: deleteCategory.name })}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteCategory(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await categoryApi.delete(deleteCategory.id);
                    toast.success(t('categories.deleted'));
                    qc.invalidateQueries({ queryKey: ['categories'] });
                    setDeleteCategory(null);
                  } catch (e) {
                    toast.error(e?.response?.data?.message ?? t('categories.deleteFailed'));
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t('categories.rowDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rowMenu &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80] cursor-default"
              aria-label="close menu"
              onClick={() => setRowMenu(null)}
            />
            <div
              role="menu"
              className="fixed z-[90] min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
              style={{
                top: `${rowMenu.rect.bottom + 4}px`,
                right: `${window.innerWidth - rowMenu.rect.right}px`,
              }}
            >
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setCreateOpen(false);
                  setEditCategory(rowMenu.category);
                  setRowMenu(null);
                }}
              >
                {t('categories.rowEdit')}
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
                onClick={() => {
                  setDeleteCategory(rowMenu.category);
                  setRowMenu(null);
                }}
              >
                {t('categories.rowDelete')}
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

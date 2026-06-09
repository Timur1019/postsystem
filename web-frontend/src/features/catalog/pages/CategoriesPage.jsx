import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../components/ui';
import CategoriesTable from '../components/categories/CategoriesTable';
import CategoryModal from '../components/categories/CategoryModal';
import CategoryDeleteModal from '../components/categories/CategoryDeleteModal';
import CategoryRowMenu from '../components/categories/CategoryRowMenu';
import { useCategoriesPage } from '../hooks/useCategoriesPage';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const c = useCategoriesPage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('categories.title')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('categories.subtitle', { count: c.categories.length })}
          </p>
        </div>
        {c.manage && (
          <BaseButton onClick={c.openCreate}>
            <Plus size={16} />
            {t('categories.add')}
          </BaseButton>
        )}
      </div>

      <CategoriesTable
        manage={c.manage}
        isLoading={c.isLoading}
        pageRows={c.pageRows}
        categories={c.categories}
        page={c.page}
        pageSize={c.pageSize}
        total={c.total}
        totalPages={c.totalPages}
        onPageChange={c.setPage}
        onPageSizeChange={c.setPageSize}
        onToggleRowMenu={c.toggleRowMenu}
      />

      {c.modalOpen && (
        <CategoryModal
          key={c.modalCategory?.id ?? 'new'}
          category={c.modalCategory}
          onClose={c.closeModal}
          onSaved={c.onModalSaved}
        />
      )}

      {c.deleteCategory && (
        <CategoryDeleteModal
          category={c.deleteCategory}
          onClose={() => c.setDeleteCategory(null)}
        />
      )}

      <CategoryRowMenu
        rowMenu={c.rowMenu}
        onClose={() => c.setRowMenu(null)}
        onEdit={c.openEdit}
        onDelete={c.openDelete}
      />
    </div>
  );
}

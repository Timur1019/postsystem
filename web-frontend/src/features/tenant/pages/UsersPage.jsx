import { Plus } from 'lucide-react';
import { BaseButton, PageLayout, PageSearchField } from '../../../components/ui';
import UserFormModal from '../components/users/UserFormModal';
import UsersTable from '../components/users/UsersTable';
import { useUsersPage } from '../hooks/useUsersPage';

export default function UsersPage({ mode = 'tenant' }) {
  const p = useUsersPage({ mode });

  return (
    <PageLayout
      title={p.title}
      subtitle={p.subtitle}
      actions={(
        <BaseButton onClick={p.openCreate}>
          <Plus size={16} />
          {p.t('users.add')}
        </BaseButton>
      )}
      filters={(
        <PageSearchField
          className="max-w-md"
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('platform.userSearch')}
        />
      )}
    >
      <UsersTable
        t={p.t}
        isPlatform={p.isPlatform}
        isLoading={p.isLoading}
        pageRows={p.pageRows}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onToggleActive={p.toggleUser}
      />

      <UserFormModal
        open={p.modalOpen}
        onClose={p.closeModal}
        isPlatform={p.isPlatform}
        mode={p.modalMode}
        editingUser={p.editingUser}
      />
    </PageLayout>
  );
}

import { Plus } from 'lucide-react';
import { BaseButton, ErrorBanner, PageLayout, PageSearchField } from '../../../components/ui';
import StoreFormModal from '../components/stores/StoreFormModal';
import StoresTable from '../components/stores/StoresTable';
import { useStoresPage } from '../hooks/useStoresPage';

export default function StoresPage({ showCompanySelect = false, companyIdFilter, companies = [] }) {
  const p = useStoresPage({ showCompanySelect, companyIdFilter, companies });

  return (
    <PageLayout
      title={p.t('stores.title')}
      actions={(
        <BaseButton variant="secondary" onClick={p.openCreate}>
          <Plus size={16} />
          {p.t('stores.add')}
        </BaseButton>
      )}
      filters={(
        <PageSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('stores.searchPlaceholder')}
        />
      )}
    >
      {p.isError && <ErrorBanner message={p.errorMessage} />}

      <StoresTable
        t={p.t}
        isPending={p.isPending}
        rows={p.rows}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onToggleActive={(id) => p.toggleMutation.mutate(id)}
        onDelete={p.tryDelete}
      />

      <StoreFormModal
        open={p.modalOpen}
        onClose={p.closeModal}
        onSubmit={(payload) => p.saveMutation.mutate(payload)}
        isPending={p.saveMutation.isPending}
        initial={p.editing}
        showCompanySelect={p.showCompanySelect}
        companies={p.companies}
      />
    </PageLayout>
  );
}

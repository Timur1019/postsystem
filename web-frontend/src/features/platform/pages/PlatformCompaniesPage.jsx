import { Plus } from 'lucide-react';
import { BaseButton, PageLayout, PageSearchField } from '../../../components/ui';
import PlatformCompanyFormModal from '../components/PlatformCompanyFormModal';
import PlatformCompaniesTable from '../components/PlatformCompaniesTable';
import { usePlatformCompaniesPage } from '../hooks/usePlatformCompaniesPage';

export default function PlatformCompaniesPage() {
  const p = usePlatformCompaniesPage();

  return (
    <PageLayout
      spacing="space-y-4"
      title={p.t('platform.companiesTitle')}
      actions={(
        <BaseButton variant="secondary" onClick={p.openCreate}>
          <Plus size={16} />
          {p.t('platform.addCompany')}
        </BaseButton>
      )}
      filters={(
        <PageSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('platform.companySearch')}
        />
      )}
    >
      <PlatformCompaniesTable
        t={p.t}
        isPending={p.isPending}
        rows={p.rows}
        menuId={p.menuId}
        onMenuOpenChange={p.setMenuId}
        onEdit={p.openEdit}
        onDelete={p.tryDelete}
      />

      <p className="text-sm text-slate-500">
        {p.t('stores.range', { from: p.fromN, to: p.toN, total: p.total })}
      </p>

      <PlatformCompanyFormModal
        open={p.modalOpen}
        editing={p.editing}
        form={p.form}
        isSaving={p.saveMutation.isPending}
        businessTypes={p.businessTypes}
        onClose={p.closeModal}
        onFieldChange={p.updateField}
        onSave={() => p.saveMutation.mutate()}
      />
    </PageLayout>
  );
}

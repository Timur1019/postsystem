import { Filter, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  BaseButton,
  ErrorBanner,
  PageLayout,
  PageSearchField,
} from '../../../components/ui';
import SupplierFiltersDrawer from '../components/suppliers/SupplierFiltersDrawer';
import SupplierModal from '../components/suppliers/SupplierModal';
import SuppliersTable from '../components/suppliers/SuppliersTable';
import { useSuppliersPage } from '../hooks/useSuppliersPage';

export default function SuppliersPage() {
  const { t } = useTranslation();
  const s = useSuppliersPage();

  return (
    <PageLayout
      title={t('suppliersModule.title')}
      actions={
        s.manage ? (
          <BaseButton variant="secondary" onClick={() => s.setAddOpen(true)}>
            <Plus size={16} />
            {t('suppliersModule.add')}
          </BaseButton>
        ) : null
      }
      filters={(
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PageSearchField
            className="flex-1"
            value={s.search}
            onChange={s.handleSearchChange}
            placeholder={t('suppliersModule.searchPh')}
          />
          <BaseButton onClick={() => s.setFiltersOpen(true)} className="shrink-0">
            <Filter size={16} />
            {t('products.toolbar.filters')}
          </BaseButton>
        </div>
      )}
    >
      {s.isError && (
        <ErrorBanner
          message={s.error?.response?.data?.message ?? s.error?.message ?? t('suppliersModule.loadError')}
        />
      )}

      <SuppliersTable
        t={t}
        loading={s.loading}
        rows={s.rows}
        fmtDate={s.fmtDate}
        showEmptyHint={s.showEmptyHint}
        page={s.page}
        pageSize={s.pageSize}
        total={s.total}
        totalPages={s.totalPages}
        onPageChange={s.setPage}
        onPageSizeChange={s.setPageSize}
      />

      <SupplierFiltersDrawer
        open={s.filtersOpen}
        onClose={() => s.setFiltersOpen(false)}
        filters={s.filters}
        onChange={s.setFilters}
        onReset={s.resetFilters}
        onApply={s.applyFilters}
      />

      <SupplierModal open={s.addOpen} onClose={() => s.setAddOpen(false)} />
    </PageLayout>
  );
}

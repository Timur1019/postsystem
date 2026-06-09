import CashRegisterErrorBanner from '../components/CashRegisterErrorBanner';
import CashRegisterHintBanner from '../components/CashRegisterHintBanner';
import CashRegisterSearchField from '../components/CashRegisterSearchField';
import CashRegistersTable from '../components/CashRegistersTable';
import CashRegistersListFooter from '../components/CashRegistersListFooter';
import CashRegistersFiltersDrawer from '../components/CashRegistersFiltersDrawer';
import CashRegisterDetailsModal from '../components/CashRegisterDetailsModal';
import { useCashRegistersListPage } from '../hooks/useCashRegistersListPage';

export default function CashRegistersListPage() {
  const p = useCashRegistersListPage();

  const errorMessage =
    p.error?.response?.data?.message ?? p.error?.message ?? p.t('cashRegisters.loadError');

  return (
    <div className="space-y-4">
      {p.isError && <CashRegisterErrorBanner message={errorMessage} />}

      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.t('cashRegisters.title')}</h1>

      <CashRegisterHintBanner
        title={p.t('cashRegisters.listHintTitle')}
        body={p.t('cashRegisters.listHintBody')}
      />

      <CashRegisterSearchField
        value={p.search}
        onChange={(e) => p.onSearchChange(e.target.value)}
        placeholder={p.t('cashRegisters.searchPlaceholder')}
        filterLabel={p.t('products.toolbar.filters')}
        onOpenFilters={() => p.setFiltersOpen(true)}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <CashRegistersTable
          t={p.t}
          rows={p.rows}
          loading={p.loading}
          togglingId={p.togglingId}
          onRowClick={p.setDetailId}
          onToggleStatus={p.handleToggleStatus}
        />
        <CashRegistersListFooter
          t={p.t}
          fromN={p.fromN}
          toN={p.toN}
          total={p.total}
          page={p.page}
          pageSize={p.pageSize}
          pageSizeOptions={p.pageSizeOptions}
          pageButtons={p.pageButtons}
          totalPages={p.totalPages}
          onPageChange={p.setPage}
          onPageSizeChange={p.setPageSize}
        />
      </div>

      <CashRegisterDetailsModal registerId={p.detailId} onClose={() => p.setDetailId(null)} />

      <CashRegistersFiltersDrawer
        open={p.filtersOpen}
        onClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onChange={p.setFilters}
        onReset={p.resetFilters}
        onApply={p.applyFilters}
      />
    </div>
  );
}

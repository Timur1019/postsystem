import { Filter, Plus, Search } from 'lucide-react';
import CashRegisterErrorBanner from '../components/CashRegisterErrorBanner';
import CashRegisterConfigTable from '../components/CashRegisterConfigTable';
import CashRegisterConfigFiltersDrawer from '../components/CashRegisterConfigFiltersDrawer';
import CashRegisterConfigAddModal from '../components/CashRegisterConfigAddModal';
import { useCashRegisterConfigPage } from '../hooks/useCashRegisterConfigPage';

export default function CashRegisterConfigPage() {
  const p = useCashRegisterConfigPage();

  const errorMessage =
    p.error?.response?.data?.message ?? p.error?.message ?? p.t('cashRegisters.configLoadError');

  return (
    <div className="space-y-4">
      {p.isError && <CashRegisterErrorBanner message={errorMessage} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.t('cashRegisters.configTitle')}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => p.setAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Plus size={16} />
            {p.t('cashRegisters.configAdd')}
          </button>
          <button
            type="button"
            onClick={() => p.setFiltersOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600"
          >
            <Filter size={16} />
            {p.t('products.toolbar.filters')}
          </button>
        </div>
      </div>

      <div className="relative min-w-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={p.search}
          onChange={(e) => p.onSearchChange(e.target.value)}
          placeholder={p.t('cashRegisters.configSearchPlaceholder')}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <CashRegisterConfigTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        onDelete={p.handleDelete}
      />

      <CashRegisterConfigFiltersDrawer
        open={p.filtersOpen}
        onClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onChange={p.setFilters}
        stores={p.stores}
        serials={p.serials}
        onApply={p.applyFilters}
        onReset={p.resetFilters}
      />

      <CashRegisterConfigAddModal
        open={p.addOpen}
        onClose={() => p.setAddOpen(false)}
        onSaved={p.onConfigSaved}
      />
    </div>
  );
}

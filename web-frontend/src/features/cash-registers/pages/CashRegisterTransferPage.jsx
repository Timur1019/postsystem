import { Download } from 'lucide-react';
import CashRegisterErrorBanner from '../components/CashRegisterErrorBanner';
import CashRegisterHintBanner from '../components/CashRegisterHintBanner';
import CashRegisterSearchField from '../components/CashRegisterSearchField';
import CashTransferTable from '../components/CashTransferTable';
import CashTransferFiltersDrawer from '../components/CashTransferFiltersDrawer';
import { useCashRegisterTransferPage } from '../hooks/useCashRegisterTransferPage';

export default function CashRegisterTransferPage() {
  const p = useCashRegisterTransferPage();

  const errorMessage =
    p.error?.response?.data?.message ?? p.error?.message ?? p.t('cashRegisters.transferLoadError');

  return (
    <div className="space-y-4">
      {p.isError && <CashRegisterErrorBanner message={errorMessage} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.t('cashRegisters.transferTitle')}</h1>
        <button
          type="button"
          onClick={p.handleExportExcel}
          disabled={p.exporting}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Download size={16} />
          {p.exporting ? p.t('cashRegisters.transferExporting') : p.t('cashRegisters.transferExport')}
        </button>
      </div>

      <CashRegisterHintBanner
        title={p.t('cashRegisters.transferHintTitle')}
        body={p.t('cashRegisters.transferHintBody')}
      />

      <CashRegisterSearchField
        value={p.search}
        onChange={(e) => p.onSearchChange(e.target.value)}
        placeholder={p.t('cashRegisters.transferSearchPlaceholder')}
        filterLabel={p.t('products.toolbar.filters')}
        onOpenFilters={() => p.setFiltersOpen(true)}
      />

      <CashTransferTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
      />

      <CashTransferFiltersDrawer
        open={p.filtersOpen}
        onClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onChange={p.setFilters}
        onApply={p.applyFilters}
        onReset={p.resetFilters}
      />
    </div>
  );
}

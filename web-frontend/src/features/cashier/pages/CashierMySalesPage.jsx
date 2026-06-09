import { useTranslation } from 'react-i18next';
import CashierSalesFilters from '../components/my-sales/CashierSalesFilters';
import CashierMySalesWorkspace from '../components/my-sales/CashierMySalesWorkspace';
import CashierMySalesReturnModal from '../components/my-sales/CashierMySalesReturnModal';
import { useCashierMySalesPage } from '../hooks/useCashierMySalesPage';

export default function CashierMySalesPage() {
  const { t } = useTranslation();
  const p = useCashierMySalesPage();

  return (
    <div className="cashier-page cashier-page--my-sales">
      <h1 className="h5 fw-bold mb-3 flex-shrink-0">{t('pos.mySalesTitle')}</h1>

      <CashierSalesFilters
        filters={p.filters}
        onPatch={p.patchFilters}
        onReset={p.resetFilters}
        filtering={p.filtering}
        t={t}
      />

      {p.salesError ? (
        <div className="alert alert-danger py-2 mb-3 flex-shrink-0" role="alert">
          {t('pos.salesLoadFailed')}
        </div>
      ) : null}

      <div className="cashier-page__scroll">
        <CashierMySalesWorkspace
          t={t}
          shiftLoading={p.shiftLoading}
          shiftId={p.shiftId}
          shift={p.shift}
          rows={p.rows}
          salesLoading={p.salesLoading}
          filtering={p.filtering}
          page={p.page}
          sales={p.sales}
          onPageChange={p.setPage}
          selectedId={p.selectedId}
          viewMode={p.viewMode}
          onViewModeChange={p.handleViewModeChange}
          onRowClick={p.handleRowClick}
          selectedRow={p.selectedRow}
          returnSaleId={p.returnSaleId}
          onReturn={() => {
            if (p.selectedRow?.status === 'VOIDED') return;
            p.setReturnSaleId(p.selectedRow.id);
          }}
          onCloseReceipt={() => p.setSelectedId(null)}
        />
      </div>

      <CashierMySalesReturnModal
        returnSaleId={p.returnSaleId}
        onClose={() => p.setReturnSaleId(null)}
        onSuccess={p.handleReturnSuccess}
      />
    </div>
  );
}

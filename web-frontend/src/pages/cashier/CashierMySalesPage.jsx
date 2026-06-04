// src/pages/cashier/CashierMySalesPage.jsx
import { useTranslation } from 'react-i18next';
import SalePartialReturnModal from '../../components/sales/SalePartialReturnModal';
import CashierSalesFilters from '../../components/cashier/my-sales/CashierSalesFilters';
import CashierSalesListCard from '../../components/cashier/my-sales/CashierSalesListCard';
import CashierSalesReceiptPane from '../../components/cashier/my-sales/CashierSalesReceiptPane';
import CashierShiftStatsBanner from '../../components/cashier/my-sales/CashierShiftStatsBanner';
import { useCashierMySalesPage } from '../../hooks/useCashierMySalesPage';

export default function CashierMySalesPage() {
  const { t } = useTranslation();
  const {
    storeId,
    page,
    setPage,
    filters,
    patchFilters,
    resetFilters,
    filtering,
    returnSaleId,
    setReturnSaleId,
    selectedId,
    setSelectedId,
    viewMode,
    handleViewModeChange,
    shift,
    shiftId,
    shiftLoading,
    sales,
    salesLoading,
    salesError,
    rows,
    selectedRow,
    handleRowClick,
    handleReturnSuccess,
  } = useCashierMySalesPage();

  return (
    <div className="cashier-page cashier-page--my-sales">
      <h1 className="h5 fw-bold mb-3 flex-shrink-0">{t('pos.mySalesTitle')}</h1>

      <CashierSalesFilters
        filters={filters}
        onPatch={patchFilters}
        onReset={resetFilters}
        filtering={filtering}
        t={t}
      />

      {salesError ? (
        <div className="alert alert-danger py-2 mb-3 flex-shrink-0" role="alert">
          {t('pos.salesLoadFailed')}
        </div>
      ) : null}

      <div className="cashier-page__scroll">
        {shiftLoading ? (
          <p className="text-muted small">{t('common.loading')}</p>
        ) : !shiftId ? (
          <div className="alert alert-warning mb-0">{t('pos.shiftRequired')}</div>
        ) : (
          <div className={`cashier-sales-master${selectedId ? ' has-selection' : ''}`}>
            <div className="cashier-sales-list-pane">
              <CashierShiftStatsBanner shift={shift} t={t} />
              <CashierSalesListCard
                rows={rows}
                isPending={salesLoading || filtering}
                page={page}
                totalPages={sales?.totalPages ?? 0}
                totalElements={sales?.totalElements ?? 0}
                onPageChange={setPage}
                selectedId={selectedId}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onRowClick={handleRowClick}
                t={t}
              />
            </div>
            {selectedId ? (
              <CashierSalesReceiptPane
                receiptNumber={selectedRow?.receiptNumber}
                selectedRow={selectedRow}
                returnDisabled={!!returnSaleId}
                onReturn={() => {
                  if (selectedRow?.status === 'VOIDED') return;
                  setReturnSaleId(selectedRow.id);
                }}
                onClose={() => setSelectedId(null)}
                t={t}
              />
            ) : null}
          </div>
        )}
      </div>

      <SalePartialReturnModal
        open={!!returnSaleId}
        saleId={returnSaleId}
        onClose={() => setReturnSaleId(null)}
        onSuccess={handleReturnSuccess}
      />
    </div>
  );
}

import { createPortal } from 'react-dom';
import { PosReturnModal } from '../../../../components/pos';
import { SalePartialReturnModal } from '../../../../components/sale-return';
import SalesLedgerFiltersDrawer from '../SalesLedgerFiltersDrawer';
import SaleFiscalPrintModal from '../SaleFiscalPrintModal';
import SalesLedgerRowMenu from './SalesLedgerRowMenu';

export default function SalesLedgerModals({
  t,
  filtersOpen,
  onFiltersClose,
  filters,
  onFiltersChange,
  stores,
  onFiltersReset,
  onFiltersApply,
  rowMenu,
  onRowMenuClose,
  onPrint,
  onReturn,
  printSaleId,
  onPrintClose,
  createReturnOpen,
  onCreateReturnClose,
  onReturnSuccess,
  returnSaleId,
  onReturnSaleClose,
}) {
  return (
    <>
      <SalesLedgerFiltersDrawer
        open={filtersOpen}
        onClose={onFiltersClose}
        filters={filters}
        onChange={onFiltersChange}
        stores={stores}
        onReset={onFiltersReset}
        onApply={onFiltersApply}
      />

      <SalesLedgerRowMenu
        menu={rowMenu}
        t={t}
        onClose={onRowMenuClose}
        onPrint={onPrint}
        onReturn={onReturn}
      />

      {printSaleId
        ? createPortal(
            <SaleFiscalPrintModal saleId={printSaleId} onClose={onPrintClose} />,
            document.body
          )
        : null}

      <PosReturnModal
        open={createReturnOpen}
        onClose={onCreateReturnClose}
        onSuccess={onReturnSuccess}
      />

      <SalePartialReturnModal
        open={!!returnSaleId}
        saleId={returnSaleId}
        onClose={onReturnSaleClose}
        onSuccess={onReturnSuccess}
      />
    </>
  );
}

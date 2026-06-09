import { PosReturnModal } from '../../../../components/pos';
import { SalePartialReturnModal } from '../../../../components/sale-return';
import ReturnsFiltersDrawer from '../ReturnsFiltersDrawer';
import ReturnDetailModal from '../ReturnDetailModal';
import ReturnReasonModal from '../ReturnReasonModal';

export default function ReturnsModals({
  filtersOpen,
  onFiltersClose,
  filters,
  onFiltersChange,
  stores,
  onFiltersReset,
  onFiltersApply,
  detailId,
  detailReason,
  onDetailClose,
  editRow,
  updateReasonSaving,
  onEditClose,
  onSaveReason,
  createReturnOpen,
  onCreateReturnClose,
  onReturnSuccess,
  continueReturnSaleId,
  onContinueReturnClose,
}) {
  return (
    <>
      <ReturnsFiltersDrawer
        open={filtersOpen}
        onClose={onFiltersClose}
        filters={filters}
        onChange={onFiltersChange}
        stores={stores}
        onReset={onFiltersReset}
        onApply={onFiltersApply}
      />

      <ReturnDetailModal
        open={!!detailId}
        returnId={detailId}
        reasonPreview={detailReason}
        onClose={onDetailClose}
      />

      <ReturnReasonModal
        open={!!editRow}
        initialReason={editRow?.reason}
        saving={updateReasonSaving}
        onClose={onEditClose}
        onSave={onSaveReason}
      />

      <PosReturnModal
        open={createReturnOpen}
        onClose={onCreateReturnClose}
        onSuccess={onReturnSuccess}
      />

      <SalePartialReturnModal
        open={!!continueReturnSaleId}
        saleId={continueReturnSaleId}
        onClose={onContinueReturnClose}
        onSuccess={onReturnSuccess}
      />
    </>
  );
}

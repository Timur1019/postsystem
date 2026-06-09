import { SalePartialReturnModal } from '../../../../components/sale-return';

export default function CashierMySalesReturnModal({
  returnSaleId,
  onClose,
  onSuccess,
}) {
  return (
    <SalePartialReturnModal
      open={!!returnSaleId}
      saleId={returnSaleId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

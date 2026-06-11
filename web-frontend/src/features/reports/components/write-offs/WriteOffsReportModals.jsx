import { WriteOffModal } from '../../../stock';
import WriteOffProductPickerModal from '../WriteOffProductPickerModal';

export default function WriteOffsReportModals({
  writeOffOpen,
  pickProduct,
  onSelectProduct,
  onClose,
  storeId,
  onSaved,
}) {
  return (
    <>
      {writeOffOpen && !pickProduct && (
        <WriteOffProductPickerModal storeId={storeId} onSelect={onSelectProduct} onClose={onClose} />
      )}

      {pickProduct && (
        <WriteOffModal
          product={pickProduct}
          storeId={storeId}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </>
  );
}

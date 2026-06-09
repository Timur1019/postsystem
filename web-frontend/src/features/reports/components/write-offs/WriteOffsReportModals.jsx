import { WriteOffModal } from '../../../stock';
import WriteOffProductPickerModal from '../WriteOffProductPickerModal';

export default function WriteOffsReportModals({
  writeOffOpen,
  pickProduct,
  productSearch,
  onSearchChange,
  productCandidates,
  onSelectProduct,
  onClose,
  storeId,
  onSaved,
}) {
  return (
    <>
      {writeOffOpen && !pickProduct && (
        <WriteOffProductPickerModal
          productSearch={productSearch}
          onSearchChange={onSearchChange}
          candidates={productCandidates}
          onSelect={onSelectProduct}
          onClose={onClose}
        />
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

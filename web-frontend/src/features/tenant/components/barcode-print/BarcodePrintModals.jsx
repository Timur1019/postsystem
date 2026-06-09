import TasnifPackagePickerModal from '../../../../components/tasnif/TasnifPackagePickerModal';
import { ShelfLabelPrintModal } from '../../../../shelfLabelPrint';

export default function BarcodePrintModals({
  packageItem,
  lang,
  onPackageSelect,
  onPackageClose,
  printOpen,
  draft,
  previewPrice,
  onClosePrint,
}) {
  return (
    <>
      <TasnifPackagePickerModal
        open={!!packageItem}
        item={packageItem}
        lang={lang}
        onSelect={onPackageSelect}
        onClose={onPackageClose}
      />

      <ShelfLabelPrintModal
        open={printOpen && !!draft}
        onClose={onClosePrint}
        productName={draft?.name ?? ''}
        barcode={draft?.barcode ?? ''}
        price={previewPrice}
        defaultVariant="priceTag"
        showInlineSettings
      />
    </>
  );
}

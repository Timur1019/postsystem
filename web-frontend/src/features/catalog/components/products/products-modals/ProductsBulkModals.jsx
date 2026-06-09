import ProductBulkVatModal from '../ProductBulkVatModal';
import ProductBulkDeleteModal from '../ProductBulkDeleteModal';

export default function ProductsBulkModals({ p }) {
  return (
    <>
      {p.bulkVatOpen && (
        <ProductBulkVatModal
          productIds={p.selectedIds}
          onClose={() => p.setBulkVatOpen(false)}
          onDone={() => {
            p.setBulkVatOpen(false);
            p.setSelectedIds(new Set());
          }}
        />
      )}

      {p.bulkDeleteOpen && (
        <ProductBulkDeleteModal
          productIds={p.selectedIds}
          onClose={() => p.setBulkDeleteOpen(false)}
          onDone={() => {
            p.setBulkDeleteOpen(false);
            p.setSelectedIds(new Set());
          }}
        />
      )}
    </>
  );
}

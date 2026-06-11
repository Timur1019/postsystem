import { useStockInventoryCreatePage } from '../hooks/useStockInventoryCreatePage';
import StockDocumentPageHeader from '../components/document-create/StockDocumentPageHeader';
import StockInventoryMetaPanel from '../components/document-create/StockInventoryMetaPanel';
import StockInventoryLinesEditor from '../components/document-create/StockInventoryLinesEditor';
import StockDocumentSubmitButton from '../components/document-create/StockDocumentSubmitButton';

export default function StockInventoryCreatePage() {
  const {
    t,
    storeId,
    setStoreId,
    notes,
    setNotes,
    lines,
    stores,
    needsStorePick,
    effectiveStoreId,
    isPending,
    updateLine,
    addLine,
    removeLine,
    submit,
  } = useStockInventoryCreatePage();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <StockDocumentPageHeader
        backTo="/reports/stock/inventories"
        backLabel={t('stockReports.inventoriesTitle')}
        title={t('stockReports.inventoryCreateTitle')}
      />

      <StockInventoryMetaPanel
        t={t}
        storeId={storeId}
        onStoreChange={(e) => setStoreId(e.target.value)}
        stores={stores}
        needsStorePick={needsStorePick}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
      />

      <StockInventoryLinesEditor
        t={t}
        lines={lines}
        storeId={effectiveStoreId}
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />

      <StockDocumentSubmitButton
        label={t('stockReports.inventorySubmit')}
        onClick={submit}
        disabled={isPending}
      />
    </div>
  );
}

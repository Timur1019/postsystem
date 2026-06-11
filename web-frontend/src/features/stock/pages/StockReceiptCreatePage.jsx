import { useStockReceiptCreatePage } from '../hooks/useStockReceiptCreatePage';
import StockDocumentPageHeader from '../components/document-create/StockDocumentPageHeader';
import StockReceiptMetaPanel from '../components/document-create/StockReceiptMetaPanel';
import StockReceiptLinesEditor from '../components/document-create/StockReceiptLinesEditor';
import StockDocumentSubmitButton from '../components/document-create/StockDocumentSubmitButton';

export default function StockReceiptCreatePage() {
  const {
    t,
    supplierId,
    setSupplierId,
    storeId,
    setStoreId,
    notes,
    setNotes,
    paymentType,
    setPaymentType,
    lines,
    stores,
    needsStorePick,
    effectiveStoreId,
    supplierList,
    isPending,
    updateLine,
    onProductPick,
    addLine,
    removeLine,
    submit,
  } = useStockReceiptCreatePage();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <StockDocumentPageHeader
        backTo="/reports/stock/receipts"
        backLabel={t('stockReports.receiptsTitle')}
        title={t('stockReports.receiptCreateTitle')}
      />

      <StockReceiptMetaPanel
        t={t}
        supplierId={supplierId}
        onSupplierChange={(e) => setSupplierId(e.target.value)}
        supplierList={supplierList}
        storeId={storeId}
        onStoreChange={(e) => setStoreId(e.target.value)}
        stores={stores}
        needsStorePick={needsStorePick}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
        paymentType={paymentType}
        onPaymentTypeChange={(e) => setPaymentType(e.target.value)}
      />

      <StockReceiptLinesEditor
        t={t}
        lines={lines}
        storeId={effectiveStoreId}
        onProductPick={onProductPick}
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />

      <StockDocumentSubmitButton
        label={t('stockReports.receiptSubmit')}
        onClick={submit}
        disabled={isPending}
        variant="full"
      />
    </div>
  );
}

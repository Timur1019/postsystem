import { useStockTransferCreatePage } from '../hooks/useStockTransferCreatePage';
import StockDocumentPageHeader from '../components/document-create/StockDocumentPageHeader';
import StockTransferStoresPanel from '../components/document-create/StockTransferStoresPanel';
import StockTransferLinesEditor from '../components/document-create/StockTransferLinesEditor';
import StockDocumentSubmitButton from '../components/document-create/StockDocumentSubmitButton';

export default function StockTransferCreatePage() {
  const {
    t,
    fromStoreId,
    setFromStoreId,
    toStoreId,
    setToStoreId,
    lines,
    stores,
    isPending,
    updateLine,
    addLine,
    removeLine,
    submit,
  } = useStockTransferCreatePage();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <StockDocumentPageHeader
        backTo="/reports/stock/transfers"
        backLabel={t('stockReports.transfersTitle')}
        title={t('stockReports.transferCreateTitle')}
        subtitle={t('stockReports.transferNote')}
      />

      <StockTransferStoresPanel
        t={t}
        fromStoreId={fromStoreId}
        onFromStoreChange={(e) => setFromStoreId(e.target.value)}
        toStoreId={toStoreId}
        onToStoreChange={(e) => setToStoreId(e.target.value)}
        stores={stores}
      />

      <StockTransferLinesEditor
        t={t}
        lines={lines}
        fromStoreId={fromStoreId}
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />

      <StockDocumentSubmitButton
        label={t('stockReports.transferSubmit')}
        onClick={submit}
        disabled={isPending}
      />
    </div>
  );
}

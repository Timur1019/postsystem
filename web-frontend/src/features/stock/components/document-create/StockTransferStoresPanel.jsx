import StockDocumentStoreSelect from './StockDocumentStoreSelect';

export default function StockTransferStoresPanel({
  t,
  fromStoreId,
  onFromStoreChange,
  toStoreId,
  onToStoreChange,
  stores,
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
      <StockDocumentStoreSelect
        label={t('stockReports.fromStore')}
        value={fromStoreId}
        onChange={onFromStoreChange}
        stores={stores}
        needsStorePick={false}
        emptyLabel="—"
        required={false}
      />
      <StockDocumentStoreSelect
        label={t('stockReports.toStore')}
        value={toStoreId}
        onChange={onToStoreChange}
        stores={stores}
        needsStorePick={false}
        emptyLabel="—"
        required={false}
      />
    </div>
  );
}

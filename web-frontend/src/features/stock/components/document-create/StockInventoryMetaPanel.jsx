import StockDocumentStoreSelect from './StockDocumentStoreSelect';
import StockDocumentNotesField from './StockDocumentNotesField';

export default function StockInventoryMetaPanel({
  t,
  storeId,
  onStoreChange,
  stores,
  needsStorePick,
  notes,
  onNotesChange,
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
      <StockDocumentStoreSelect
        label={t('stockReports.colStore')}
        value={storeId}
        onChange={onStoreChange}
        stores={stores}
        needsStorePick={needsStorePick}
        emptyLabel={needsStorePick ? t('stockModal.pickStore') : '—'}
      />
      <StockDocumentNotesField
        label={t('stockReports.writeOffNotes')}
        value={notes}
        onChange={onNotesChange}
      />
    </div>
  );
}

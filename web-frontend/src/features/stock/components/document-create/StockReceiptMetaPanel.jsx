import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';
import StockDocumentStoreSelect from './StockDocumentStoreSelect';
import StockDocumentNotesField from './StockDocumentNotesField';

export default function StockReceiptMetaPanel({
  t,
  supplierId,
  onSupplierChange,
  supplierList,
  storeId,
  onStoreChange,
  stores,
  needsStorePick,
  notes,
  onNotesChange,
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium">{t('stockReports.colSupplier')}</label>
        <select className={STOCK_DOC_INPUT_CLS} value={supplierId} onChange={onSupplierChange}>
          <option value="">—</option>
          {supplierList.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <StockDocumentStoreSelect
        label={t('stockReports.colStore')}
        value={storeId}
        onChange={onStoreChange}
        stores={stores}
        needsStorePick={needsStorePick}
        emptyLabel={needsStorePick ? t('stockModal.pickStore') : t('stockReports.allStores')}
      />
      <StockDocumentNotesField
        label={t('stockReports.writeOffNotes')}
        value={notes}
        onChange={onNotesChange}
      />
    </div>
  );
}

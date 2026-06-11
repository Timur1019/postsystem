import { BaseSelect } from '../../../../components/ui';
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
  paymentType,
  onPaymentTypeChange,
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
      <BaseSelect
        label={t('stockReports.colSupplier')}
        value={supplierId}
        onChange={onSupplierChange}
        placeholder="—"
        options={[
          { value: '', label: '—' },
          ...supplierList.map((s) => ({ value: String(s.id), label: s.name })),
        ]}
      />
      <StockDocumentStoreSelect
        label={t('stockReports.colStore')}
        value={storeId}
        onChange={onStoreChange}
        stores={stores}
        needsStorePick={needsStorePick}
        emptyLabel={needsStorePick ? t('stockModal.pickStore') : t('stockReports.allStores')}
      />
      <BaseSelect
        label={t('stockReports.paymentType')}
        value={paymentType}
        onChange={onPaymentTypeChange}
        options={[
          { value: 'CASH', label: t('stockReports.paymentCash') },
          { value: 'CREDIT', label: t('stockReports.paymentCredit') },
        ]}
      />
      <StockDocumentNotesField
        label={t('stockReports.writeOffNotes')}
        value={notes}
        onChange={onNotesChange}
      />
    </div>
  );
}

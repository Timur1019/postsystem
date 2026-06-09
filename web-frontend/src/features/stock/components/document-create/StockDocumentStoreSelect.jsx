import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';

export default function StockDocumentStoreSelect({
  label,
  value,
  onChange,
  stores,
  needsStorePick,
  emptyLabel,
  required,
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      <select
        className={STOCK_DOC_INPUT_CLS}
        value={value}
        onChange={onChange}
        required={required ?? needsStorePick}
      >
        <option value="">{emptyLabel}</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}

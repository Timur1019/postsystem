import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';

export default function StockDocumentNotesField({ label, value, onChange, className = 'sm:col-span-2' }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      <input className={STOCK_DOC_INPUT_CLS} value={value} onChange={onChange} />
    </div>
  );
}

import { Trash2 } from 'lucide-react';
import { ProductLookupSelect } from '../../../../components/product-lookup';
import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';
import StockDocumentAddLineButton from './StockDocumentAddLineButton';

export default function StockTransferLinesEditor({
  t,
  lines,
  fromStoreId,
  updateLine,
  addLine,
  removeLine,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {lines.map((line, idx) => (
        <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
          <ProductLookupSelect
            value={line.productId}
            storeId={fromStoreId}
            disabled={!fromStoreId}
            placeholder={t('stockReports.pickProduct')}
            onChange={(e) => updateLine(idx, { productId: e.target.value })}
          />
          <input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => updateLine(idx, { quantity: e.target.value })}
            className={STOCK_DOC_INPUT_CLS}
          />
          <button type="button" onClick={() => removeLine(idx)} className="text-red-600">
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <StockDocumentAddLineButton label={t('stockReports.addLine')} onClick={addLine} />
    </div>
  );
}

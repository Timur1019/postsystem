import { Trash2 } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';
import StockDocumentAddLineButton from './StockDocumentAddLineButton';

export default function StockTransferLinesEditor({
  t,
  lines,
  catalog,
  updateLine,
  addLine,
  removeLine,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {lines.map((line, idx) => (
        <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
          <BaseSelect
            value={line.productId}
            onChange={(e) => updateLine(idx, { productId: e.target.value })}
            placeholder={t('stockReports.pickProduct')}
            options={[
              { value: '', label: t('stockReports.pickProduct') },
              ...catalog.map((pr) => ({
                value: String(pr.id),
                label: `${pr.name} — ${pr.stockQuantity} ${t('stockReports.unitsSuffix')}`,
              })),
            ]}
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

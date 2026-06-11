import { Trash2 } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';
import StockDocumentAddLineButton from './StockDocumentAddLineButton';

export default function StockReceiptLinesEditor({
  t,
  lines,
  catalog,
  onProductPick,
  updateLine,
  addLine,
  removeLine,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t('stockReports.receiptLines')}</h2>
        <StockDocumentAddLineButton label={t('stockReports.addLine')} onClick={addLine} iconSize={14} />
      </div>
      {lines.map((line, idx) => (
        <div key={idx} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <BaseSelect
              value={line.productId}
              onChange={(e) => onProductPick(idx, e.target.value)}
              placeholder={t('stockReports.pickProduct')}
              options={[
                { value: '', label: t('stockReports.pickProduct') },
                ...catalog.map((p) => ({ value: String(p.id), label: p.name })),
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              min={1}
              className={STOCK_DOC_INPUT_CLS}
              placeholder={t('stockReports.colQty')}
              value={line.quantity}
              onChange={(e) => updateLine(idx, { quantity: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              className={STOCK_DOC_INPUT_CLS}
              placeholder={t('stockReports.purchasePrice')}
              value={line.purchasePrice}
              onChange={(e) => updateLine(idx, { purchasePrice: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              className={STOCK_DOC_INPUT_CLS}
              placeholder={t('stockReports.salePrice')}
              value={line.unitSellingPrice}
              onChange={(e) => updateLine(idx, { unitSellingPrice: e.target.value })}
            />
          </div>
          <div className="flex items-center sm:col-span-1">
            {lines.length > 1 && (
              <button type="button" onClick={() => removeLine(idx)} className="text-red-600">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

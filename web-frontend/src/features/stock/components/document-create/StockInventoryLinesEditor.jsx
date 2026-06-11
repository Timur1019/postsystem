import { Trash2 } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';
import StockDocumentAddLineButton from './StockDocumentAddLineButton';

export default function StockInventoryLinesEditor({
  t,
  lines,
  catalog,
  updateLine,
  addLine,
  removeLine,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-semibold">{t('stockReports.inventoryLines')}</h2>
      {lines.map((line, idx) => {
        const product = catalog.find((x) => x.id === line.productId);
        return (
          <div key={idx} className="grid gap-2 rounded-lg border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-[1fr_8rem_8rem_auto]">
            <BaseSelect
              value={line.productId}
              onChange={(e) => updateLine(idx, { productId: e.target.value })}
              placeholder={t('stockReports.pickProduct')}
              options={[
                { value: '', label: t('stockReports.pickProduct') },
                ...catalog.map((pr) => ({
                  value: String(pr.id),
                  label: `${pr.name} (${pr.sku})`,
                })),
              ]}
            />
            <div className="text-xs text-slate-500 self-center">
              {product ? t('stockReports.systemQty', { qty: product.stockQuantity }) : '—'}
            </div>
            <input
              type="number"
              min={0}
              placeholder={t('stockReports.countedQty')}
              value={line.countedQuantity}
              onChange={(e) => updateLine(idx, { countedQuantity: e.target.value })}
              className={STOCK_DOC_INPUT_CLS}
            />
            <button type="button" onClick={() => removeLine(idx)} className="text-red-600">
              <Trash2 size={18} />
            </button>
          </div>
        );
      })}
      <StockDocumentAddLineButton label={t('stockReports.addLine')} onClick={addLine} />
    </div>
  );
}

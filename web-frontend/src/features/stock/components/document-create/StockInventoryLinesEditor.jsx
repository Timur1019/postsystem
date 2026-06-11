import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ProductLookupSelect } from '../../../../components/product-lookup';
import { STOCK_DOC_INPUT_CLS } from '../../utils/stockDocumentFormUtils';
import StockDocumentAddLineButton from './StockDocumentAddLineButton';

export default function StockInventoryLinesEditor({
  t,
  lines,
  storeId,
  updateLine,
  addLine,
  removeLine,
}) {
  const [productByLine, setProductByLine] = useState({});

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-semibold">{t('stockReports.inventoryLines')}</h2>
      {lines.map((line, idx) => {
        const product = productByLine[idx];
        return (
          <div key={idx} className="grid gap-2 rounded-lg border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-[1fr_8rem_8rem_auto]">
            <ProductLookupSelect
              value={line.productId}
              storeId={storeId}
              disabled={!storeId}
              placeholder={t('stockReports.pickProduct')}
              onChange={(e) => updateLine(idx, { productId: e.target.value })}
              onProductSelect={(picked) =>
                setProductByLine((prev) => {
                  const next = { ...prev };
                  if (picked) next[idx] = picked;
                  else delete next[idx];
                  return next;
                })
              }
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

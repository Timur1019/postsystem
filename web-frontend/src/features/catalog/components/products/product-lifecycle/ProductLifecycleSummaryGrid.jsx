import { format } from 'date-fns';
import ProductLifecycleSummaryCard from './ProductLifecycleSummaryCard';

export default function ProductLifecycleSummaryGrid({ t, summary }) {
  if (!summary) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ProductLifecycleSummaryCard label={t('products.lifecycle.currentStock')} value={summary.currentStock} />
      <ProductLifecycleSummaryCard label={t('products.lifecycle.dispatched')} value={summary.stockDispatched} />
      <ProductLifecycleSummaryCard label={t('products.lifecycle.restocked')} value={summary.restockUnits} />
      <ProductLifecycleSummaryCard label={t('products.lifecycle.sold')} value={summary.saleUnits} />
      <ProductLifecycleSummaryCard label={t('products.lifecycle.returned')} value={summary.returnUnits} />
      <ProductLifecycleSummaryCard label={t('products.lifecycle.writeOff')} value={summary.writeOffUnits} />
      <ProductLifecycleSummaryCard label={t('products.lifecycle.adjustment')} value={summary.adjustmentNetUnits} />
      {summary.productCreatedAt && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {t('products.lifecycle.createdAt')}
          </div>
          <div className="font-medium text-slate-900 dark:text-white">
            {format(new Date(summary.productCreatedAt), 'dd.MM.yyyy HH:mm')}
          </div>
        </div>
      )}
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { ProductLifecycleSection } from '../../catalog';
import { ProductLookupSelect } from '../../../components/product-lookup';
import { useProductLifecycleReportPage } from '../hooks/useProductLifecycleReportPage';

export default function ProductLifecycleReportPage() {
  const { t } = useTranslation();
  const r = useProductLifecycleReportPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('stockReports.lifecycleTitle')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('stockReports.lifecycleSubtitle')}
        </p>
      </div>

      <ProductLookupSelect
        className="max-w-xl"
        value={r.selectedId}
        onChange={r.handleProductChange}
        placeholder={t('stockReports.lifecycleSearchPlaceholder')}
        showStockInList={false}
      />

      {r.selectedProduct && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <History size={20} className="text-emerald-700 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">{r.selectedProduct.name}</p>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {t('products.colSku')}: {r.selectedProduct.sku}
              {r.selectedProduct.barcode ? ` · ${r.selectedProduct.barcode}` : ''}
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {t('stockReports.lifecycleOpenCatalog')}
          </Link>
        </div>
      )}

      {!r.selectedId && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600">
          {t('stockReports.lifecyclePickProduct')}
        </p>
      )}

      {r.selectedId && <ProductLifecycleSection productId={r.selectedId} showStoreFilter />}
    </div>
  );
}

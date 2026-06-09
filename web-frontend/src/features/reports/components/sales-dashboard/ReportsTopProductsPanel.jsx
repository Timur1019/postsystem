export default function ReportsTopProductsPanel({ t, products, formatCurrency }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none p-5">
      <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('reports.topByUnits')}</h2>
      {products?.length > 0 ? (
        <div className="reports-scroll-list max-h-[min(22rem,52vh)] space-y-3 overflow-y-auto overscroll-contain pr-1">
          {products.map((product, i) => (
            <div key={product.productId} className="flex items-center gap-3">
              <span className="w-5 text-xs text-slate-500 dark:text-slate-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate text-slate-900 dark:text-white">{product.productName}</span>
                  <span className="ml-2 flex-shrink-0 text-slate-600 dark:text-slate-400">
                    {product.quantitySold} {t('reports.unitsSuffix')}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(product.quantitySold / products[0].quantitySold) * 100}%` }}
                  />
                </div>
              </div>
              <span className="flex-shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(product.revenue)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">{t('common.noData')}</p>
      )}
    </div>
  );
}

import { fmtMoney } from '../../../../../utils/formatMoney';

export default function ProductInfoPricesCard({ t, storePrices }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
        {t('productCatalog.sectionPrices')}:
      </div>
      {(storePrices?.length ?? 0) === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">—</div>
      ) : (
        <div className="space-y-2">
          {storePrices.map((sp) => (
            <div key={sp.storeId} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-700 dark:text-slate-200">{sp.storeName}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{fmtMoney(sp.price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Plus, Trash2 } from 'lucide-react';
import { inputCls } from './productCatalogFormUi';

export default function ProductCatalogStorePricesSection({
  t,
  stores,
  storeRows,
  setStoreRows,
  getValues,
  sellingPriceWatch,
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionPrices')}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('productCatalog.storePriceHint')}</p>
      <div className="space-y-2">
        {storeRows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-600 dark:text-slate-500">{t('productCatalog.store')}</label>
              <select
                className={inputCls}
                value={row.storeId}
                onChange={(e) => {
                  const v = e.target.value;
                  const sell = getValues('sellingPrice');
                  setStoreRows((rs) =>
                    rs.map((r, i) => {
                      if (i !== idx) return r;
                      const price =
                        r.price === '' && sell != null && sell !== ''
                          ? String(sell)
                          : r.price;
                      return { ...r, storeId: v, price };
                    })
                  );
                }}
              >
                <option value="">{t('productCatalog.storePlaceholder')}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="text-xs text-slate-600 dark:text-slate-500">
                {t('productCatalog.storeSellingPrice')}
              </label>
              <input
                type="number"
                step="0.01"
                className={inputCls}
                placeholder={sellingPriceWatch != null ? String(sellingPriceWatch) : ''}
                value={row.price}
                onChange={(e) => {
                  const v = e.target.value;
                  setStoreRows((rs) => rs.map((r, i) => (i === idx ? { ...r, price: v } : r)));
                }}
              />
            </div>
            <button
              type="button"
              className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400"
              onClick={() => setStoreRows((rs) => rs.filter((_, i) => i !== idx))}
              disabled={storeRows.length <= 1}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setStoreRows((rs) => [...rs, { storeId: '', price: '' }])}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <Plus size={14} /> {t('productCatalog.addStoreRow')}
        </button>
      </div>
    </section>
  );
}

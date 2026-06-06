import { Plus, Trash2 } from 'lucide-react';
import { inputCls, ProductCatalogField } from './productCatalogFormUi';

export default function ProductCatalogBarcodesSection({
  t,
  register,
  errors,
  extraBarcodes,
  setExtraBarcodes,
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionBarcodes')}
      </h3>
      <ProductCatalogField label={t('productModal.barcode')} error={errors.barcode?.message}>
        <input {...register('barcode')} className={inputCls} />
      </ProductCatalogField>
      {extraBarcodes.map((val, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className={inputCls}
            value={val}
            placeholder={t('productCatalog.extraBarcodePh')}
            onChange={(e) =>
              setExtraBarcodes((xs) => xs.map((x, i) => (i === idx ? e.target.value : x)))
            }
          />
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400"
            onClick={() => setExtraBarcodes((xs) => xs.filter((_, i) => i !== idx))}
            disabled={extraBarcodes.length <= 1}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setExtraBarcodes((xs) => [...xs, ''])}
        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
      >
        <Plus size={14} /> {t('productCatalog.addBarcode')}
      </button>
    </section>
  );
}

// src/components/products/ProductExportModal.jsx
import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi } from '../../services/api';

export default function ProductExportModal({ stores, onClose }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const [exporting, setExporting] = useState(false);

  const toggle = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const runExport = async () => {
    setExporting(true);
    try {
      const res = await productApi.exportList({
        storeIds: selected.length ? selected.join(',') : null,
        markupPercent: 0,
        priceOverrides: [],
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('products.export.done'));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('products.export.failed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="product-export-modal w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">{t('products.export.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
            <Info className="flex-shrink-0 text-sky-600 dark:text-sky-400" size={18} />
            <p>{t('products.export.info')}</p>
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-600 dark:text-slate-500">{t('products.export.pickStores')}</p>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {stores.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('products.import.close')}
          </button>
          <button
            type="button"
            onClick={runExport}
            disabled={exporting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {exporting ? '…' : t('products.export.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

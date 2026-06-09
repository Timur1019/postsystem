// src/components/products/ProductsToolbar.jsx
import {
  Plus,
  Upload,
  Download,
  Percent,
  Trash2,
  Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProductsToolbar({
  onAdd,
  onImport,
  onExport,
  onBulkVat,
  onDeleteAll,
  onOpenFilters,
  canManage,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {canManage && (
        <>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
          >
            <Plus size={16} />
            {t('products.toolbar.add')}
          </button>
          <button
            type="button"
            onClick={onImport}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Upload size={16} />
            {t('products.toolbar.import')}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download size={16} />
            {t('products.toolbar.export')}
          </button>
          <button
            type="button"
            onClick={onBulkVat}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Percent size={16} />
            {t('products.toolbar.bulkVat')}
          </button>
          <button
            type="button"
            onClick={onDeleteAll}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            <Trash2 size={16} />
            {t('products.toolbar.deleteAll')}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Filter size={16} />
        {t('products.toolbar.filters')}
      </button>
    </div>
  );
}

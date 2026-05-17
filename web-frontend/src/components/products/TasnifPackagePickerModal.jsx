import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../styles/tasnif-search.css';

export default function TasnifPackagePickerModal({ open, item, lang, onSelect, onClose }) {
  const { t } = useTranslation();
  if (!open || !item) return null;

  const packages = item.packages ?? [];

  const unitLabel = (pkg) => {
    if (lang?.startsWith('ru')) {
      return pkg.nameRu || pkg.nameUz || pkg.nameLat || '—';
    }
    return pkg.nameUz || pkg.nameRu || pkg.nameLat || '—';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-labelledby="tasnif-package-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 id="tasnif-package-title" className="text-base font-semibold text-slate-900 dark:text-white">
            {t('productCatalog.selectPackage')}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="px-4 pt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.name}</p>
        <div className="p-4">
          {packages.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('productCatalog.noPackages')}</p>
          ) : (
            <div className="tasnif-package-modal__list">
              {packages.map((pkg) => (
                <button
                  key={pkg.code}
                  type="button"
                  className="tasnif-package-modal__option"
                  onClick={() => onSelect(pkg)}
                >
                  <div className="tasnif-package-modal__code">{pkg.code}</div>
                  <div className="tasnif-package-modal__unit">{unitLabel(pkg)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

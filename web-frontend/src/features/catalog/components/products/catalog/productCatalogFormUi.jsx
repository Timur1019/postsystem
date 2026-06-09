export const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`;

export const OWNER_TYPES = ['OWN', 'COMMISSION', 'AGENT'];
export const VAT_OPTIONS = [0, 12, 15, 16];

export function ProductCatalogField({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {required && <span className="text-red-400">* </span>}
        {label}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

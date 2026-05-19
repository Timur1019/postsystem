export default function SettingsFieldToggles({ defs, values, onChange, labelFor }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {defs.map(({ key, labelKey }) => (
        <label
          key={key}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50"
        >
          <input
            type="checkbox"
            className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
            checked={values[key] !== false}
            onChange={(e) => onChange(key, e.target.checked)}
          />
          <span className="text-slate-700 dark:text-slate-200">{labelFor(labelKey)}</span>
        </label>
      ))}
    </div>
  );
}

export function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-700">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export function VariantTabs({ variant, onChange, labelTab, priceTagTab }) {
  const tabCls = (active) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-emerald-600 text-white shadow'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      <button type="button" className={tabCls(variant === 'label')} onClick={() => onChange('label')}>
        {labelTab}
      </button>
      <button type="button" className={tabCls(variant === 'priceTag')} onClick={() => onChange('priceTag')}>
        {priceTagTab}
      </button>
    </div>
  );
}

export function CopiesStepper({ label, copies, onChange, onBump }) {
  return (
    <div className="mb-6 mt-2 flex items-center justify-center gap-4">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <button
        type="button"
        className="h-10 w-10 rounded-lg border border-slate-300 bg-white text-lg dark:border-slate-600 dark:bg-slate-800"
        onClick={() => onBump(-1)}
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={999}
        value={copies}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-20 rounded-lg border border-slate-300 bg-white px-2 text-center font-mono text-base text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      />
      <button
        type="button"
        className="h-10 w-10 rounded-lg border border-slate-300 bg-white text-lg dark:border-slate-600 dark:bg-slate-800"
        onClick={() => onBump(1)}
      >
        +
      </button>
    </div>
  );
}

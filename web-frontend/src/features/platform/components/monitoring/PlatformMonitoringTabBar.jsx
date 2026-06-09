export default function PlatformMonitoringTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-2 border-b border-slate-200 text-sm dark:border-slate-800">
      {tabs.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onTabChange(it.id)}
          className={`-mb-px border-b-2 px-3 py-2 font-medium transition-colors ${
            activeTab === it.id
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

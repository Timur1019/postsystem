import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function SidebarGroupExpanded({
  t,
  label,
  icon: Icon,
  isOpen,
  onToggle,
  isActive,
  items,
  subLinkClass,
}) {
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          isActive
            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
            : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon size={18} className="flex-shrink-0 opacity-90" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen ? (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
          {items.map(({ to, key, icon: ItemIcon }) => (
            <NavLink key={to} to={to} className={subLinkClass}>
              <ItemIcon size={16} className="flex-shrink-0 opacity-80" />
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

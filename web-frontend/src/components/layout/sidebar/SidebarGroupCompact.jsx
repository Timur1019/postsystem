import { NavLink } from 'react-router-dom';

export default function SidebarGroupCompact({ t, items }) {
  return (
    <div className="space-y-1 pt-1">
      {items.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={t(`nav.${key}`)}
          className={({ isActive }) =>
            `flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
              isActive
                ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-emerald-900/40'
            }`
          }
        >
          <Icon size={18} />
        </NavLink>
      ))}
    </div>
  );
}

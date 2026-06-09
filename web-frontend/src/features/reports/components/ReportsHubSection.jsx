import { Link } from 'react-router-dom';

export default function ReportsHubSection({ title, subtitle, links, t }) {
  if (links.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map(({ to, key, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icon size={20} aria-hidden />
            </span>
            <span className="min-w-0 font-semibold text-slate-900 dark:text-white">{t(`nav.${key}`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {title && (
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

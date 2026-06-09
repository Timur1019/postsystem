import { Link } from 'react-router-dom';

export default function StockDocumentPageHeader({ backTo, backLabel, title, subtitle }) {
  return (
    <div>
      <Link to={backTo} className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        ← {backLabel}
      </Link>
      <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

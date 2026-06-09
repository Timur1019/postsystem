import { Link } from 'react-router-dom';
import { fmtMoney } from '../../../../utils/formatMoney';

export default function StockDashboardKpiGrid({ cards, formatUnits, t, isLoading, isError }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map(({ icon: Icon, label, units, money, color, link }) => {
        const inner = (
          <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${link ? 'hover:border-emerald-500/50 transition' : ''}`}>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon size={16} className={`text-${color}-600`} />
              <p className="text-xs">{label}</p>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              {`${formatUnits(units)} ${t('stockReports.unitsSuffix')}`}
            </p>
            {money != null && !isLoading && !isError && (
              <p className="text-xs text-slate-500">{fmtMoney(money)}</p>
            )}
          </div>
        );
        return link ? <Link key={label} to={link}>{inner}</Link> : <div key={label}>{inner}</div>;
      })}
    </div>
  );
}

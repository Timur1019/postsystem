import { formatMoney } from '../../utils/formatMoney';
import '../../../../styles/finance/daily-chart.css';

export default function FinanceDailyChart({ days, t, title }) {
  if (!days?.length) {
    return null;
  }

  const maxValue = Math.max(
    ...days.flatMap((d) => [Number(d.income) || 0, Number(d.expense) || 0]),
    1
  );

  return (
    <section className="finance-daily-chart">
      <h2 className="finance-daily-chart__title">{title ?? t('finance.dashboard.last7Days')}</h2>
      <div className="finance-daily-chart__legend">
        <span className="finance-daily-chart__legend-item finance-daily-chart__legend-item--income">
          {t('finance.dashboard.income')}
        </span>
        <span className="finance-daily-chart__legend-item finance-daily-chart__legend-item--expense">
          {t('finance.dashboard.expense')}
        </span>
      </div>
      <div
        className="finance-daily-chart__grid"
        style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 31)}, minmax(2rem, 1fr))` }}
      >
        {days.map((day) => {
          const incomeHeight = `${((Number(day.income) || 0) / maxValue) * 100}%`;
          const expenseHeight = `${((Number(day.expense) || 0) / maxValue) * 100}%`;
          const label = day.date?.slice(5) ?? '';
          return (
            <div key={day.date} className="finance-daily-chart__column" title={`${day.date}: +${formatMoney(day.income)} / -${formatMoney(day.expense)}`}>
              <div className="finance-daily-chart__bars">
                <div className="finance-daily-chart__bar finance-daily-chart__bar--income" style={{ height: incomeHeight }} />
                <div className="finance-daily-chart__bar finance-daily-chart__bar--expense" style={{ height: expenseHeight }} />
              </div>
              <span className="finance-daily-chart__label">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function FinanceKpiCard({ title, value, tone = 'neutral' }) {
  const toneClass = {
    income: 'finance-kpi--income',
    expense: 'finance-kpi--expense',
    profit: 'finance-kpi--profit',
    neutral: 'finance-kpi--neutral',
  }[tone] || 'finance-kpi--neutral';

  return (
    <div className={`finance-kpi ${toneClass}`}>
      <p className="finance-kpi__title">{title}</p>
      <p className="finance-kpi__value">{value}</p>
    </div>
  );
}

import { TrendingDown, TrendingUp } from 'lucide-react';
import { fmtMoney } from '../../../utils/formatMoney';

export default function PeriodCompareDelta({ value, pct }) {
  const up = Number(value) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const cls = up ? 'text-emerald-600' : 'text-red-600';

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${cls}`}>
      <Icon size={14} />
      {fmtMoney(value)} ({pct}%)
    </span>
  );
}

import { fmtMoney } from '../../../../utils/formatMoney';

export default function CreditAdvanceCell({ row, t }) {
  const type = row.receiptType;
  if (type !== 'CREDIT' && type !== 'ADVANCE') {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
        {t(`pos.receiptType.${type}`)}
      </span>
      <span className="font-medium text-slate-900 dark:text-white">{fmtMoney(row.totalAmount)}</span>
    </div>
  );
}

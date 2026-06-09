export default function ShiftCell({ row, t, fmtAt }) {
  if (!row.shiftId) {
    return <span className="text-slate-400">{t('salesLedger.shiftNoData')}</span>;
  }
  const opened = row.shiftOpenedAt ? fmtAt(row.shiftOpenedAt) : '—';
  const closed = row.shiftClosedAt
    ? fmtAt(row.shiftClosedAt)
    : row.shiftStatus === 'OPEN'
      ? t('salesLedger.shiftStillOpen')
      : '—';
  return (
    <div className="min-w-[10.5rem] text-slate-800 dark:text-slate-200">
      <div className="text-xs">
        <span className="text-slate-500">{t('salesLedger.shiftOpened')}: </span>
        {opened}
      </div>
      <div className="text-xs">
        <span className="text-slate-500">{t('salesLedger.shiftClosed')}: </span>
        {closed}
      </div>
      {row.shiftZReportId ? (
        <div className="mt-0.5 font-mono text-[0.65rem] text-emerald-700 dark:text-emerald-400">
          {t('salesLedger.shiftZReport', { id: row.shiftZReportId })}
        </div>
      ) : null}
    </div>
  );
}

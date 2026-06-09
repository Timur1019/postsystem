import { Play, Pause } from 'lucide-react';

const COL_COUNT = 6;

export default function CashRegistersTable({
  t,
  rows,
  loading,
  togglingId,
  onRowClick,
  onToggleStatus,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <th className="px-4 py-3">{t('cashRegisters.colStore')}</th>
            <th className="px-4 py-3">{t('cashRegisters.colRegisterNo')}</th>
            <th className="px-4 py-3">{t('cashRegisters.colModel')}</th>
            <th className="px-4 py-3">{t('cashRegisters.colSerial')}</th>
            <th className="px-4 py-3">{t('cashRegisters.colFiscal')}</th>
            <th className="w-24 px-4 py-3 text-center">{t('cashRegisters.colStatus')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-slate-500">
                {t('common.loading')}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-slate-500">
                {t('cashRegisters.empty')}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                onClick={() => onRowClick(row.id)}
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.storeName}</td>
                <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{row.registerNumber}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.equipmentModel ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                  {row.equipmentSerial ?? '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                  {row.fiscalCardId ?? '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      disabled={togglingId === row.id}
                      title={t('cashRegisters.statusToggleActive')}
                      onClick={(e) => onToggleStatus(e, row)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/80 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                    >
                      <Play size={12} className="shrink-0" strokeWidth={2.5} aria-hidden />
                      {t('cashRegisters.statusActive')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={togglingId === row.id}
                      title={t('cashRegisters.statusToggleInactive')}
                      onClick={(e) => onToggleStatus(e, row)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Pause size={12} className="shrink-0" aria-hidden />
                      {t('cashRegisters.statusInactive')}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

import { MoreVertical } from 'lucide-react';
import TablePagination from '../../../../components/shared/TablePagination';
import { fmtMoney } from '../../../../utils/formatMoney';
import { fmtCashRegisterDateTime } from '../../utils/cashRegisterDisplayUtils';

const COL_COUNT = 10;

export default function ZReportsTable({
  t,
  rows,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  selectAllRef,
  allPageSelected,
  toggleSelect,
  toggleSelectAllPage,
  onOpenRowMenu,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="w-10 px-3 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAllPage}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-3 py-3">{t('zReports.colFiscalCard')}</th>
              <th className="px-3 py-3">{t('zReports.colDate')}</th>
              <th className="px-3 py-3">{t('zReports.colZNumber')}</th>
              <th className="px-3 py-3 text-right">{t('zReports.colTotal')}</th>
              <th className="px-3 py-3">{t('zReports.colPayments')}</th>
              <th className="px-3 py-3 text-right">{t('zReports.colVat')}</th>
              <th className="px-3 py-3">{t('zReports.colStore')}</th>
              <th className="px-3 py-3">{t('zReports.colTerminalSerial')}</th>
              <th className="w-12 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-10 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-10 text-center text-slate-500">
                  {t('zReports.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-800 dark:text-slate-200">{row.fiscalCardId}</td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-medium text-amber-800 dark:text-amber-200/90">
                      {t('zReports.openedPrefix')} {fmtCashRegisterDateTime(row.openedAt)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('zReports.closedPrefix')} {fmtCashRegisterDateTime(row.closedAt)}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{row.zNumber}</td>
                  <td className="px-3 py-2 text-right text-base font-bold text-slate-900 dark:text-white">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="space-y-0.5">
                      <div>{t('zReports.saleCash')}: {fmtMoney(row.cashTotal)}</div>
                      <div>{t('zReports.saleCard')}: {fmtMoney(row.cardTotal)}</div>
                      <div>{t('zReports.saleHumo')}: {fmtMoney(row.humoTotal)}</div>
                      <div>{t('zReports.saleUzcard')}: {fmtMoney(row.uzcardTotal)}</div>
                      <div>{t('zReports.saleCashless')}: {fmtMoney(row.cashlessTotal)}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">{fmtMoney(row.vatAmount)}</td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.storeName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{row.terminalSerial ?? '—'}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={(e) => onOpenRowMenu(e, row)}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

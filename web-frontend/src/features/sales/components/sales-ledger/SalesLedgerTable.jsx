import { MoreVertical } from 'lucide-react';
import TablePagination from '../../../../components/shared/TablePagination';
import { fmtMoney } from '../../../../utils/formatMoney';
import CreditAdvanceCell from './CreditAdvanceCell';
import PaymentIcon from './PaymentIcon';
import ShiftCell from './ShiftCell';

const COL_COUNT = 11;

export default function SalesLedgerTable({
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
  toggleSelect,
  allPageSelected,
  selectAllRef,
  toggleSelectAllPage,
  fmtAt,
  paymentIconMethod,
  paymentLabel,
  onOpenRowMenu,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-sm">
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
              <th className="px-3 py-3">{t('salesLedger.colDateReceipt')}</th>
              <th className="px-3 py-3">{t('salesLedger.colStore')}</th>
              <th className="px-3 py-3">{t('salesLedger.colEmployee')}</th>
              <th className="px-3 py-3">{t('salesLedger.colShift')}</th>
              <th className="px-3 py-3 text-right">{t('salesLedger.colTotal')}</th>
              <th className="px-3 py-3 text-right">{t('salesLedger.colCreditAdvance')}</th>
              <th className="px-3 py-3">{t('salesLedger.colPayment')}</th>
              <th className="px-3 py-3 text-right">{t('salesLedger.colGrandTotal')}</th>
              <th className="px-3 py-3 text-right">{t('salesLedger.colReturns')}</th>
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
                  {t('salesLedger.empty')}
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
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                    <div>{fmtAt(row.createdAt)}</div>
                    <div className="font-mono text-xs text-slate-500">/ {row.receiptNumber}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.storeName ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.cashierName ?? '—'}</td>
                  <td className="px-3 py-2">
                    <ShiftCell row={row} t={t} fmtAt={fmtAt} />
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <CreditAdvanceCell row={row} t={t} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <PaymentIcon method={paymentIconMethod(row)} />
                      <span className="text-xs">{paymentLabel(row)}</span>
                      {row.receiptType !== 'CREDIT' && row.receiptType !== 'ADVANCE' ? (
                        <span className="text-xs text-slate-500">{fmtMoney(row.amountTendered)}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(row.returnAmount) > 0 ||
                    row.status === 'VOIDED' ||
                    row.status === 'REFUNDED' ? (
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {fmtMoney(row.returnAmount ?? row.totalAmount)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRowMenu(row, e.currentTarget.getBoundingClientRect());
                      }}
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

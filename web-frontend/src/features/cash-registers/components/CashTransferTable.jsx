import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import { fmtCashRegisterDateTime } from '../utils/cashRegisterDisplayUtils';

const COL_COUNT = 15;

export default function CashTransferTable({
  t,
  rows,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupStoreRegister')}</div>
              </th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupOpenClose')}</div>
              </th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" rowSpan={2}>
                <div className="flex h-full items-center justify-center">{t('cashRegisters.transferColCashier')}</div>
              </th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupSales')}</div>
              </th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={3}>
                <div className="leading-tight">{t('cashRegisters.transferGroupPayments')}</div>
              </th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupReturns')}</div>
              </th>
              <th className="px-2 py-2" colSpan={3}>
                <div className="leading-tight">{t('cashRegisters.transferGroupReturnMethods')}</div>
              </th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColStore')}</th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColRegister')}</th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColOpened')}</th>
              <th className="border-r border-slate-200 px-2 py-2 dark:border-slate-700">{t('cashRegisters.transferColClosed')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColSaleQty')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColSaleTotal')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColPayCash')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColPayCard')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColPayNonCash')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetQty')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetTotal')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetCash')}</th>
              <th className="border-r border-slate-200 px-2 py-2 text-right dark:border-slate-700">{t('cashRegisters.transferColRetCard')}</th>
              <th className="px-2 py-2 text-right">{t('cashRegisters.transferColRetNonCash')}</th>
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
                  {t('cashRegisters.transferEmptyBanner')}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.zReportId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="max-w-[180px] truncate border-r border-slate-100 px-2 py-2 text-slate-900 dark:border-slate-800 dark:text-slate-100">
                    {r.storeName}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {r.registerNumber != null ? r.registerNumber : '—'}
                  </td>
                  <td className="whitespace-nowrap border-r border-slate-100 px-2 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    {fmtCashRegisterDateTime(r.openedAt)}
                  </td>
                  <td className="whitespace-nowrap border-r border-slate-100 px-2 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    {fmtCashRegisterDateTime(r.closedAt)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {r.cashierName}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {r.salesCount}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums font-medium text-slate-900 dark:border-slate-800 dark:text-white">
                    {fmtMoney(r.totalAmount)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {fmtMoney(r.paymentCash)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {fmtMoney(r.paymentCard)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {fmtMoney(r.paymentNonCash)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {r.returnsCount}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {fmtMoney(r.returnsTotalAmount)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {fmtMoney(r.returnsCash)}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {fmtMoney(r.returnsCard)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                    {fmtMoney(r.returnsNonCash)}
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
